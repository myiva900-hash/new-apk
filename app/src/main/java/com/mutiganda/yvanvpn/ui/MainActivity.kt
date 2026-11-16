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
import com.mutiganda.yvanvpn.service.MyvVpnService

class MainActivity : ComponentActivity() {

    private lateinit var webView: WebView
    private var pendingServerHost = "gisozi.kigali.myv-vpn.rw"
    private var pendingServerPort = 80

    private val vpnPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            launchVpnService()
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

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
                    if (url.startsWith("https://wa.me/") || url.startsWith("whatsapp://") || url.startsWith("tel:") || url.startsWith("mailto:")) {
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
                        // Fallback to embedded bundled offline version if device is offline
                        view?.loadUrl("file:///android_asset/www/index.html")
                    }
                }
            }

            addJavascriptInterface(VpnBridge(), "AndroidVpn")
            // Loads the live cloud online version automatically so updates reflect instantly
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

    inner class VpnBridge {
        @JavascriptInterface
        fun startVpn(serverHost: String, serverPort: Int) {
            pendingServerHost = serverHost
            pendingServerPort = serverPort
            runOnUiThread {
                prepareAndStartVpn()
            }
        }

        @JavascriptInterface
        fun stopVpn() {
            runOnUiThread {
                stopVpnService()
            }
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

    private fun prepareAndStartVpn() {
        val intent = VpnService.prepare(this)
        if (intent != null) {
            vpnPermissionLauncher.launch(intent)
        } else {
            launchVpnService()
        }
    }

    private fun launchVpnService() {
        val intent = Intent(this, MyvVpnService::class.java).apply {
            action = MyvVpnService.ACTION_START
            putExtra(MyvVpnService.EXTRA_SERVER_HOST, pendingServerHost)
            putExtra(MyvVpnService.EXTRA_SERVER_PORT, pendingServerPort)
        }
        startService(intent)
    }

    private fun stopVpnService() {
        val intent = Intent(this, MyvVpnService::class.java).apply {
            action = MyvVpnService.ACTION_STOP
        }
        startService(intent)
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }
}
