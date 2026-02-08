// Minimal GNOME Shell extension: exposes DBus methods for window tiling.
// Calls unmaximize() + move_resize_frame() synchronously inside Mutter.
// No race conditions — all operations run in-process.

import Meta from 'gi://Meta';
import Gio from 'gi://Gio';

const IFACE = `
<node>
  <interface name="org.gnome.Shell.Extensions.TileHelper">
    <method name="Tile">
      <arg type="s" direction="in" name="wmClass"/>
      <arg type="i" direction="in" name="x"/>
      <arg type="i" direction="in" name="y"/>
      <arg type="i" direction="in" name="width"/>
      <arg type="i" direction="in" name="height"/>
      <arg type="b" direction="out" name="success"/>
    </method>
    <method name="Maximize">
      <arg type="s" direction="in" name="wmClass"/>
      <arg type="b" direction="out" name="success"/>
    </method>
    <method name="Minimize">
      <arg type="s" direction="in" name="wmClass"/>
      <arg type="b" direction="out" name="success"/>
    </method>
    <method name="TileXid">
      <arg type="u" direction="in" name="xid"/>
      <arg type="i" direction="in" name="x"/>
      <arg type="i" direction="in" name="y"/>
      <arg type="i" direction="in" name="width"/>
      <arg type="i" direction="in" name="height"/>
      <arg type="b" direction="out" name="success"/>
    </method>
    <method name="MaximizeXid">
      <arg type="u" direction="in" name="xid"/>
      <arg type="b" direction="out" name="success"/>
    </method>
    <method name="MinimizeXid">
      <arg type="u" direction="in" name="xid"/>
      <arg type="b" direction="out" name="success"/>
    </method>
  </interface>
</node>`;

function _findByClass(wmClass) {
    const target = wmClass.toLowerCase();
    return global.get_window_actors()
        .map(a => a.meta_window)
        .filter(w => w.get_window_type() === Meta.WindowType.NORMAL)
        .find(w => {
            const cls = (w.get_wm_class() || '').toLowerCase();
            const inst = (w.get_wm_class_instance() || '').toLowerCase();
            return cls === target || inst === target;
        });
}

function _findByXid(xid) {
    const hex = `0x${xid.toString(16)}`;
    return global.get_window_actors()
        .map(a => a.meta_window)
        .find(w => w.get_description() === hex);
}

function _tileWindow(win, x, y, width, height) {
    if (!win) return false;
    if (win.minimized)
        win.unminimize();
    if (win.get_maximized())
        win.unmaximize(Meta.MaximizeFlags.BOTH);
    win.move_resize_frame(false, x, y, width, height);
    win.activate(global.get_current_time());
    return true;
}

export default class TileHelperExtension {
    enable() {
        this._dbus = Gio.DBusExportedObject.wrapJSObject(IFACE, this);
        this._dbus.export(
            Gio.DBus.session,
            '/org/gnome/Shell/Extensions/TileHelper'
        );
    }

    disable() {
        this._dbus.unexport();
        this._dbus = null;
    }

    // Class-based methods (match by WM_CLASS name)
    Tile(wmClass, x, y, width, height) {
        return _tileWindow(_findByClass(wmClass), x, y, width, height);
    }

    Maximize(wmClass) {
        const win = _findByClass(wmClass);
        if (!win) return false;
        if (win.minimized) win.unminimize();
        win.maximize(Meta.MaximizeFlags.BOTH);
        win.activate(global.get_current_time());
        return true;
    }

    Minimize(wmClass) {
        const win = _findByClass(wmClass);
        if (!win) return false;
        win.minimize();
        return true;
    }

    // XID-based methods (target exact window by X11 ID)
    TileXid(xid, x, y, width, height) {
        return _tileWindow(_findByXid(xid), x, y, width, height);
    }

    MaximizeXid(xid) {
        const win = _findByXid(xid);
        if (!win) return false;
        if (win.minimized) win.unminimize();
        win.maximize(Meta.MaximizeFlags.BOTH);
        win.activate(global.get_current_time());
        return true;
    }

    MinimizeXid(xid) {
        const win = _findByXid(xid);
        if (!win) return false;
        win.minimize();
        return true;
    }
}
