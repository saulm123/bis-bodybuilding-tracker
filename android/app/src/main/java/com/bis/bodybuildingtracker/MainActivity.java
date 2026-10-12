package com.bis.bodybuildingtracker;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Exercise demo clips are silent loops: let them start without a tap.
        // (Android's web view blocks all autoplay by default.)
        getBridge().getWebView().getSettings().setMediaPlaybackRequiresUserGesture(false);
    }
}
