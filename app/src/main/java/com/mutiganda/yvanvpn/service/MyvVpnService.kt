package com.mutiganda.yvanvpn.service

import android.net.VpnService

/**
 * Legacy manifest VpnService declaration retained cleanly; real packet encryption
 * and TUN management run through WireGuard's official GoBackend.VpnService in WireGuardController.
 */
class MyvVpnService : VpnService()
