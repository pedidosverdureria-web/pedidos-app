
// Android-specific implementation using MaterialIcons

import React from "react";
import { SymbolWeight } from "expo-symbols";
import {
  OpaqueColorValue,
  StyleProp,
  TextStyle,
  ViewStyle,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

// Add your SFSymbol to MaterialIcons mappings here.
const MAPPING = {
  // See MaterialIcons here: https://icons.expo.fyi
  // See SF Symbols in the SF Symbols app on Mac.

  // Navigation & Home
  "house.fill": "home",
  "house": "home",
  "arrow.left": "arrow-back",
  "arrow.right": "arrow-forward",
  "arrow.up": "arrow-upward",
  "arrow.down": "arrow-downward",
  "chevron.left": "chevron-left",
  "chevron.right": "chevron-right",
  "chevron.up": "keyboard-arrow-up",
  "chevron.down": "keyboard-arrow-down",
  "arrow.clockwise": "refresh",
  "arrow.counterclockwise": "refresh",

  // Communication & Social
  "paperplane.fill": "send",
  "paperplane": "send",
  "envelope.fill": "mail",
  "envelope": "mail",
  "phone.fill": "phone",
  "phone": "phone",
  "message.fill": "message",
  "message": "message",
  "bell.fill": "notifications",
  "bell": "notifications",
  "heart.fill": "favorite",
  "heart": "favorite-border",

  // Actions & Controls
  "plus": "add",
  "plus.circle.fill": "add-circle",
  "minus": "remove",
  "xmark": "close",
  "xmark.circle.fill": "cancel",
  "xmark.circle": "cancel",
  "checkmark": "check",
  "checkmark.circle.fill": "check-circle",
  "checkmark.circle": "check-circle",
  "checkmark.square.fill": "check-box",
  "checkmark.square": "check-box-outline-blank",
  "multiply": "clear",
  "trash.fill": "delete",
  "trash": "delete",
  "stop.circle.fill": "cancel",

  // Editing & Creation
  "pencil": "edit",
  "pencil.circle.fill": "edit",
  "pencil.and.list.clipboard": "edit-note",
  "square.and.pencil": "edit",
  "doc.text.fill": "description",
  "doc.text": "description",
  "folder.fill": "folder",
  "folder": "folder",
  "doc.fill": "insert-drive-file",
  "doc": "insert-drive-file",

  // Media & Content
  "photo.fill": "image",
  "photo": "image",
  "camera.fill": "camera-alt",
  "camera": "camera-alt",
  "video.fill": "videocam",
  "video": "videocam",
  "music.note": "music-note",
  "speaker.wave.2.fill": "volume-up",
  "speaker.slash.fill": "volume-off",
  "play.fill": "play-arrow",
  "pause.fill": "pause",
  "stop.fill": "stop",

  // System & Settings
  "gear": "settings",
  "gearshape.fill": "settings",
  "slider.horizontal.3": "tune",
  "info.circle.fill": "info",
  "info.circle": "info",
  "exclamationmark.triangle.fill": "warning",
  "exclamationmark.triangle": "warning",
  "questionmark.circle.fill": "help",
  "questionmark.circle": "help",

  // Shapes & Symbols
  "square": "crop-square",
  "square.grid.3x3": "apps",
  "circle": "circle",
  "triangle.fill": "change-history",
  "star.fill": "star",
  "star": "star-border",
  "bookmark.fill": "bookmark",
  "bookmark": "bookmark-border",
  "number": "tag",

  // Technology & Code
  "chevron.left.forwardslash.chevron.right": "code",
  "qrcode.viewfinder": "qr-code",
  "wifi": "wifi",
  "antenna.radiowaves.left.and.right": "signal-cellular-alt",
  "battery.100": "battery-full",
  "battery.25": "battery-2-bar",
  "lock.fill": "lock",
  "lock.open.fill": "lock-open",

  // Shopping & Commerce
  "cart.fill": "shopping-cart",
  "cart": "shopping-cart",
  "cart.badge.plus": "add-shopping-cart",
  "creditcard.fill": "credit-card",
  "creditcard": "credit-card",
  "dollarsign.circle.fill": "monetization-on",
  "dollarsign.circle": "monetization-on",
  "bag.fill": "shopping-bag",
  "bag": "shopping-bag",

  // Location & Maps
  "location.fill": "location-on",
  "location": "location-on",
  "map.fill": "map",
  "map": "map",
  "compass.drawing": "explore",

  // Time & Calendar
  "clock.fill": "access-time",
  "clock": "access-time",
  "calendar": "event",
  "timer": "timer",

  // User & Profile
  "person": "person",
  "person.fill": "person",
  "person.2.fill": "group",
  "person.2": "group",
  "person.circle.fill": "account-circle",
  "person.circle": "account-circle",
  "person.crop.circle.fill": "account-circle",
  "person.crop.circle": "account-circle",
  "person.badge.plus": "person-add",
  "person.crop.circle.badge.plus": "person-add",

  // Sharing & Export
  "square.and.arrow.up": "share",
  "square.and.arrow.down": "download",
  "arrow.up.doc.fill": "upload-file",
  "link": "link",

  // Search & Discovery
  "magnifyingglass": "search",
  "line.3.horizontal.decrease": "filter-list",
  "arrow.up.arrow.down": "sort",

  // Visibility & Display
  "eye.fill": "visibility",
  "eye.slash.fill": "visibility-off",
  "lightbulb.fill": "lightbulb",
  "moon.fill": "dark-mode",
  "sun.max.fill": "light-mode",

  // Printer & Office
  "printer.fill": "print",
  "printer": "print",

  // Bolt & Power
  "bolt.fill": "bolt",
  "bolt": "bolt",
} as Partial<
  Record<
    import("expo-symbols").SymbolViewProps["name"],
    React.ComponentProps<typeof MaterialIcons>["name"]
  >
>;

export type IconSymbolName = keyof typeof MAPPING;

/**
 * An icon component that uses MaterialIcons on Android.
 * This ensures proper icon rendering on Android devices.
 */
export function IconSymbol({
  name,
  ios_icon_name,
  android_material_icon_name,
  size = 24,
  color,
  style,
}: {
  name?: IconSymbolName;
  ios_icon_name?: string;
  android_material_icon_name?: string;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
}) {
  // Priority: android_material_icon_name > name (with mapping)
  let iconName: string | undefined;
  
  if (android_material_icon_name) {
    iconName = android_material_icon_name;
  } else if (name && MAPPING[name]) {
    iconName = MAPPING[name];
  }
  
  if (!iconName) {
    console.warn(`IconSymbol: No valid Android icon name provided. name=${name}, android_material_icon_name=${android_material_icon_name}`);
    // Return a fallback icon instead of null
    iconName = "help";
  }

  return (
    <MaterialIcons
      color={color}
      size={size}
      name={iconName as any}
      style={style as StyleProp<TextStyle>}
    />
  );
}
