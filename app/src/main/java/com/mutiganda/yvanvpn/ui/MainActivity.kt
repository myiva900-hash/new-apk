package com.mutiganda.yvanvpn.ui

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.net.VpnService
import android.os.Bundle
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
import org.json.JSONObject

class MainActivity : ComponentActivity() {

    private lateinit var webView: WebView
    private lateinit var wireGuardController: WireGuardController
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
        val intent = GoBackend.VpnService.prepare(this) ?: VpnService.prepare(this)
        if (intent != null) {
            vpnPermissionLauncher.launch(intent)
        } else {
            wireGuardController.connect(pendingConfigIni, pendingServerLabel)
        }
    }

    override fun onDestroy() {
        wireGuardController.destroy()
        webView.destroy()
        super.onDestroy()
    }
}
