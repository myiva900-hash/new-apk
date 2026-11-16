package com.mutiganda.yvanvpn.service

import android.content.Context
import com.wireguard.android.backend.GoBackend
import com.wireguard.android.backend.Statistics
import com.wireguard.android.backend.Tunnel
import com.wireguard.config.Config
import com.wireguard.crypto.KeyPair
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.io.ByteArrayInputStream

class WireGuardController(
    private val context: Context,
    private val onNativeEvent: (String, JSONObject) -> Unit
) {
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private var backend: GoBackend? = null
    private var statsJob: Job? = null
    private var activeTunnelName: String = "myv_wg0"
    private var currentState: String = "disconnected"
    private var lastRxBytes: Long = 0L
    private var lastTxBytes: Long = 0L
    private var connectedAtMs: Long = 0L

    private val tunnel = object : Tunnel {
        override fun getName(): String = activeTunnelName

        override fun onStateChange(newState: Tunnel.State) {
            currentState = when (newState) {
                Tunnel.State.UP -> "connected"
                Tunnel.State.TOGGLE -> "connecting"
                Tunnel.State.DOWN -> "disconnected"
            }
            if (newState == Tunnel.State.UP && connectedAtMs == 0L) {
                connectedAtMs = System.currentTimeMillis()
            } else if (newState == Tunnel.State.DOWN) {
                connectedAtMs = 0L
            }

            emitState()
            emitLog(
                if (newState == Tunnel.State.UP) "success" else "info",
                "[WireGuard GoBackend] Tunnel '$activeTunnelName' state -> ${newState.name}"
            )
        }
    }

    @Synchronized
    private fun getOrCreateBackend(): GoBackend {
        val existing = backend
        if (existing != null) return existing
        return GoBackend(context.applicationContext).also { backend = it }
    }

    fun generateKeyPairJson(): String {
        val kp = KeyPair()
        return JSONObject().apply {
            put("privateKey", kp.privateKey.toBase64())
            put("publicKey", kp.publicKey.toBase64())
        }.toString()
    }

    fun getStatusJson(): String {
        return JSONObject().apply {
            put("status", currentState)
            put("rxBytes", lastRxBytes)
            put("txBytes", lastTxBytes)
            put("connectedSeconds", if (connectedAtMs > 0L) (System.currentTimeMillis() - connectedAtMs) / 1000L else 0L)
            put("tunnelName", activeTunnelName)
        }.toString()
    }

    fun connect(wgQuickConfigIni: String, serverLabel: String) {
        scope.launch {
            try {
                currentState = "connecting"
                emitState()
                emitLog("info", "[WireGuard] Parsing wg-quick configuration for $serverLabel...")

                val parsedConfig = Config.parse(ByteArrayInputStream(wgQuickConfigIni.toByteArray(Charsets.UTF_8)))
                val wgBackend = getOrCreateBackend()

                emitLog("info", "[WireGuard] Starting GoBackend Android VpnService TUN interface...")
                val finalState = wgBackend.setState(tunnel, Tunnel.State.UP, parsedConfig)

                if (finalState == Tunnel.State.UP) {
                    connectedAtMs = System.currentTimeMillis()
                    lastRxBytes = 0L
                    lastTxBytes = 0L
                    currentState = "connected"
                    emitState()
                    emitLog("success", "[WireGuard] Active TUN interface UP. Connected to $serverLabel")
                    startStatsPolling(wgBackend)
                } else {
                    currentState = "disconnected"
                    emitState()
                    emitLog("error", "[WireGuard] Tunnel did not reach UP state (${finalState.name})")
                }
            } catch (e: Exception) {
                currentState = "disconnected"
                connectedAtMs = 0L
                emitState()
                emitLog("error", "[WireGuard Error] ${e.message ?: e.javaClass.simpleName}")
            }
        }
    }

    fun disconnect() {
        scope.launch {
            try {
                currentState = "disconnecting"
                emitState()
                emitLog("warn", "[WireGuard] Stopping tunnel '$activeTunnelName'...")
                statsJob?.cancel()
                statsJob = null

                val wgBackend = getOrCreateBackend()
                wgBackend.setState(tunnel, Tunnel.State.DOWN, null)
                connectedAtMs = 0L
                currentState = "disconnected"
                emitState()
                emitLog("info", "[WireGuard] Tunnel stopped. Total RX=$lastRxBytes B, TX=$lastTxBytes B")
            } catch (e: Exception) {
                currentState = "disconnected"
                emitState()
                emitLog("error", "[WireGuard Stop Error] ${e.message ?: e.javaClass.simpleName}")
            }
        }
    }

    private fun startStatsPolling(wgBackend: GoBackend) {
        statsJob?.cancel()
        statsJob = scope.launch {
            var prevRx = 0L
            var prevTx = 0L
            while (isActive && currentState == "connected") {
                try {
                    val stats: Statistics = wgBackend.getStatistics(tunnel)
                    val totalRx = stats.totalRx()
                    val totalTx = stats.totalTx()
                    val rxSpeed = (totalRx - prevRx).coerceAtLeast(0L)
                    val txSpeed = (totalTx - prevTx).coerceAtLeast(0L)
                    prevRx = totalRx
                    prevTx = totalTx
                    lastRxBytes = totalRx
                    lastTxBytes = totalTx

                    var latestHandshakeMs = 0L
                    for (peerKey in stats.peers()) {
                        val peerStats = stats.peer(peerKey)
                        if (peerStats != null && peerStats.latestHandshakeEpochMillis > latestHandshakeMs) {
                            latestHandshakeMs = peerStats.latestHandshakeEpochMillis
                        }
                    }

                    val payload = JSONObject().apply {
                        put("rxBytes", totalRx)
                        put("txBytes", totalTx)
                        put("rxSpeed", rxSpeed)
                        put("txSpeed", txSpeed)
                        put("latestHandshakeEpochMs", latestHandshakeMs)
                        put("connectedSeconds", if (connectedAtMs > 0L) (System.currentTimeMillis() - connectedAtMs) / 1000L else 0L)
                    }
                    onNativeEvent("traffic", payload)
                } catch (e: Exception) {
                    emitLog("warn", "[WireGuard Stats] ${e.message}")
                }
                delay(1000L)
            }
        }
    }

    private fun emitState() {
        val payload = JSONObject().apply {
            put("status", currentState)
            put("tunnelName", activeTunnelName)
            put("connectedSeconds", if (connectedAtMs > 0L) (System.currentTimeMillis() - connectedAtMs) / 1000L else 0L)
        }
        onNativeEvent("state", payload)
    }

    private fun emitLog(level: String, message: String) {
        val payload = JSONObject().apply {
            put("level", level)
            put("message", message)
        }
        onNativeEvent("log", payload)
    }

    fun destroy() {
        statsJob?.cancel()
    }
}
