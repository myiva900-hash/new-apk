package com.mutiganda.yvanvpn.ui

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.net.VpnService
import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.view.ViewGroup
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import com.mutiganda.yvanvpn.service.WireGuardController
import com.wireguard.android.backend.GoBackend
import org.json.JSONArray
import org.json.JSONObject
import java.util.Locale

class MainActivity : ComponentActivity() {

    private lateinit var webView: WebView
    private lateinit var wireGuardController: WireGuardController
    private var tts: TextToSpeech? = null
    private var ttsReady: Boolean = false
    private var pendingConfigIni: String = ""
    private var pendingServerLabel: String = "WireGuard Tunnel"

    private val vpnPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK && pendingConfigIni.isNotBlank()) {
            wireGuardController.connect(pendingConfigIni, pendingServerLabel)
        } else {
            val err = JSONObject().apply {
                put("level", "error")
                put("message", "[Android VpnService] VPN permission was denied by user.")
            }
            dispatchToWeb("log", err)
            dispatchToWeb("state", JSONObject().apply { put("status", "disconnected") })
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        initOfflineTextToSpeech()

        wireGuardController = WireGuardController(this) { eventType, payload ->
            dispatchToWeb(eventType, payload)
        }

        webView = WebView(this).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )

            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                databaseEnabled = true
                allowFileAccess = true
                allowContentAccess = true
                loadsImagesAutomatically = true
                useWideViewPort = true
                loadWithOverviewMode = true
                cacheMode = WebSettings.LOAD_DEFAULT
                mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            }

            webChromeClient = WebChromeClient()

            webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(
                    view: WebView?,
                    request: WebResourceRequest?
                ): Boolean {
                    val url = request?.url?.toString() ?: return false
                    if (
                        url.startsWith("https://wa.me/") ||
                        url.startsWith("whatsapp://") ||
                        url.startsWith("tel:") ||
                        url.startsWith("mailto:")
                    ) {
                        try {
                            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                            startActivity(intent)
                            return true
                        } catch (e: Exception) {
                            e.printStackTrace()
                        }
                    }
                    return false
                }

                override fun onReceivedError(
                    view: WebView?,
                    request: WebResourceRequest?,
                    error: WebResourceError?
                ) {
                    if (request?.isForMainFrame == true) {
                        view?.loadUrl("file:///android_asset/www/index.html")
                    }
                }
            }

            addJavascriptInterface(VpnBridge(), "AndroidVpn")
            loadUrl("https://ais-pre-cmw46z3ccjwjrwsdznksfu-385114119254.us-east1.run.app")
        }

        setContentView(webView)

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })
    }

    private fun initOfflineTextToSpeech() {
        tts = TextToSpeech(applicationContext) { status ->
            if (status == TextToSpeech.SUCCESS) {
                val engine = tts ?: return@TextToSpeech
                val langResult = engine.setLanguage(Locale.US)
                if (langResult == TextToSpeech.LANG_MISSING_DATA || langResult == TextToSpeech.LANG_NOT_SUPPORTED) {
                    engine.language = Locale.getDefault()
                }
                // Deep male-style cadence, works 100% offline using Android's system TTS engine
                engine.setPitch(0.80f)
                engine.setSpeechRate(0.94f)
                engine.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                    override fun onStart(utteranceId: String?) {
                        if (utteranceId != null && utteranceId.startsWith("guide_step_")) {
                            val step = utteranceId.removePrefix("guide_step_").toIntOrNull()
                            if (step != null) {
                                dispatchToWeb("tts_step", JSONObject().apply { put("step", step) })
                            }
                        }
                    }

                    override fun onDone(utteranceId: String?) {
                        if (utteranceId == "guide_last_step") {
                            dispatchToWeb("tts_done", JSONObject())
                        }
                    }

                    @Deprecated("Deprecated in Java")
                    override fun onError(utteranceId: String?) {
                        dispatchToWeb("tts_done", JSONObject())
                    }
                })
                ttsReady = true
            }
        }
    }

    private fun dispatchToWeb(eventType: String, payload: JSONObject) {
        val escapedType = JSONObject.quote(eventType)
        val jsonStr = payload.toString()
        runOnUiThread {
            if (::webView.isInitialized) {
                webView.evaluateJavascript(
                    "window.__MYV_NATIVE_BRIDGE__ && window.__MYV_NATIVE_BRIDGE__.onNativeEvent($escapedType, $jsonStr);",
                    null
                )
            }
        }
    }

    inner class VpnBridge {
        @JavascriptInterface
        fun isNativeAndroid(): Boolean = true

        @JavascriptInterface
        fun isWireGuardSupported(): Boolean = true

        @JavascriptInterface
        fun isOfflineTtsAvailable(): Boolean = ttsReady

        @JavascriptInterface
        fun speakOffline(stepsJsonOrText: String) {
            val engine = tts ?: return
            if (!ttsReady) return
            runOnUiThread {
                try {
                    engine.stop()
                    val trimmed = stepsJsonOrText.trim()
                    if (trimmed.startsWith("[")) {
                        val arr = JSONArray(trimmed)
                        for (i in 0 until arr.length()) {
                            val text = arr.optString(i, "")
                            if (text.isBlank()) continue
                            val queueMode = if (i == 0) TextToSpeech.QUEUE_FLUSH else TextToSpeech.QUEUE_ADD
                            val uttId = if (i == arr.length() - 1) "guide_last_step" else "guide_step_$i"
                            val params = Bundle().apply {
                                putInt(TextToSpeech.Engine.KEY_PARAM_STREAM, android.media.AudioManager.STREAM_MUSIC)
                            }
                            if (i == arr.length() - 1) {
                                dispatchToWeb("tts_step", JSONObject().apply { put("step", i) })
                            }
                            engine.speak(text, queueMode, params, uttId)
                        }
                    } else if (trimmed.isNotBlank()) {
                        engine.speak(trimmed, TextToSpeech.QUEUE_FLUSH, null, "single_phrase")
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        }

        @JavascriptInterface
        fun stopSpeakOffline() {
            runOnUiThread {
                try {
                    tts?.stop()
                    dispatchToWeb("tts_done", JSONObject())
                } catch (_: Exception) {
                }
            }
        }

        @JavascriptInterface
        fun startWireGuard(configIni: String, serverLabel: String) {
            pendingConfigIni = configIni
            pendingServerLabel = serverLabel
            runOnUiThread {
                prepareAndStartWireGuard()
            }
        }

        @JavascriptInterface
        fun stopWireGuard() {
            wireGuardController.disconnect()
        }

        @JavascriptInterface
        fun getStatusJson(): String {
            return wireGuardController.getStatusJson()
        }

        @JavascriptInterface
        fun generateWireGuardKeyPair(): String {
            return wireGuardController.generateKeyPairJson()
        }

        @JavascriptInterface
        fun openWhatsApp(phoneNumber: String) {
            runOnUiThread {
                try {
                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://wa.me/$phoneNumber"))
                    startActivity(intent)
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        }
    }

    private fun prepareAndStartWireGuard() {
        dispatchToWeb(
            "log",
            JSONObject().apply {
                put("level", "info")
                put("message", "[Android VpnService] Preparing VPN permission for $pendingServerLabel...")
            }
        )
        val intent = VpnService.prepare(this)
        if (intent != null) {
            vpnPermissionLauncher.launch(intent)
        } else {
            wireGuardController.connect(pendingConfigIni, pendingServerLabel)
        }
    }

    override fun onDestroy() {
        wireGuardController.destroy()
        tts?.stop()
        tts?.shutdown()
        webView.destroy()
        super.onDestroy()
    }
}
