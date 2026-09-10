const nativewindBabel = function () {
  const cssInterop = require("react-native-css-interop/babel")();
  return {
    ...cssInterop,
    plugins: cssInterop.plugins.filter(
      (plugin) =>
        plugin !== "react-native-worklets/plugin" &&
        plugin?.[0] !== "react-native-worklets/plugin"
    ),
  };
};

module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      nativewindBabel,
    ],
    plugins: ["react-native-reanimated/plugin"],
  };
};
