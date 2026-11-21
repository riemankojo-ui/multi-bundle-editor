package com.multibundle.editor;

import android.graphics.Color;
import android.os.Bundle;
import android.view.Window;

import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(FolderAccessPlugin.class);
        super.onCreate(savedInstanceState);
        Window w = getWindow();
        int top = Color.parseColor("#15161a");
        w.getDecorView().setBackgroundColor(top);
        w.setStatusBarColor(top);
        w.setNavigationBarColor(Color.parseColor("#0d0e12"));
        WindowInsetsControllerCompat c = WindowCompat.getInsetsController(w, w.getDecorView());
        c.setAppearanceLightStatusBars(false);
        c.setAppearanceLightNavigationBars(false);
    }
}
