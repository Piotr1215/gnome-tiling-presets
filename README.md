# gnome-tiling-presets

Minimal GNOME Shell extension that exposes a DBus interface for pixel-perfect window tiling on X11.

## Why

External tools (wmctrl, xdotool) send async X11 messages. Unmaximize and resize are separate events that race in Mutter, causing gaps and flicker. This extension runs inside Mutter where `unmaximize()` + `move_resize_frame()` execute synchronously.

## Install

```bash
mkdir -p ~/.local/share/gnome-shell/extensions/tile-helper@gnome-tiling-presets
cp extension.js metadata.json ~/.local/share/gnome-shell/extensions/tile-helper@gnome-tiling-presets/
gnome-extensions enable tile-helper@gnome-tiling-presets
```

Restart GNOME Shell: Alt+F2 → `r` → Enter.

## DBus API

All methods are on `org.gnome.Shell.Extensions.TileHelper` at `/org/gnome/Shell/Extensions/TileHelper`.

### By WM_CLASS (first matching window)

```bash
# Tile to specific geometry
gdbus call --session -d org.gnome.Shell \
  -o /org/gnome/Shell/Extensions/TileHelper \
  -m org.gnome.Shell.Extensions.TileHelper.Tile "Alacritty" 0 32 1920 2128

# Maximize
gdbus call --session -d org.gnome.Shell \
  -o /org/gnome/Shell/Extensions/TileHelper \
  -m org.gnome.Shell.Extensions.TileHelper.Maximize "Navigator"

# Minimize
gdbus call --session -d org.gnome.Shell \
  -o /org/gnome/Shell/Extensions/TileHelper \
  -m org.gnome.Shell.Extensions.TileHelper.Minimize "Slack"
```

### By X11 window ID (target exact window)

Use when multiple windows share the same WM_CLASS (e.g., two browser windows).

```bash
# Get window ID with xdotool
wid=$(xdotool search --onlyvisible --classname Alacritty | head -n 1)

# Tile by XID
gdbus call --session -d org.gnome.Shell \
  -o /org/gnome/Shell/Extensions/TileHelper \
  -m org.gnome.Shell.Extensions.TileHelper.TileXid "$wid" 0 32 1920 2128

# MaximizeXid, MinimizeXid also available
```

## Example: side-by-side layout

```bash
#!/usr/bin/env bash
# Browser left, terminal right on 3840x2160 (work area starts at y=32)
browser=$(xdotool search --onlyvisible --classname Navigator | head -n 1)
terminal=$(xdotool search --onlyvisible --classname Alacritty | head -n 1)

DEST="org.gnome.Shell"
PATH="/org/gnome/Shell/Extensions/TileHelper"
IFACE="org.gnome.Shell.Extensions.TileHelper"

gdbus call --session -d "$DEST" -o "$PATH" -m "$IFACE.TileXid" "$browser" 0 32 1920 2128
gdbus call --session -d "$DEST" -o "$PATH" -m "$IFACE.TileXid" "$terminal" 1920 32 1920 2128
```

## Requirements

- GNOME Shell 46 (X11 session)
- `xdotool` for window discovery (XID methods)

## License

MIT
