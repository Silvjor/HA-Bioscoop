const path = require("path");

module.exports = {
  entry: "./src/main.js",
  mode: "production",
  output: {
    filename: "bioscoop.js",
    path: path.resolve(__dirname),
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        type: 'asset/inline',
        generator: {
          dataUrl: content => {
            content = content.toString();
            return content;
          }
        }
      },

      {
        test: /\.(svg)$/i,
        type: "asset/inline",
        generator: {
          dataUrl: content => {
            content = content.toString();
            return content;
          }
        }
      },
    ],
  },
};
