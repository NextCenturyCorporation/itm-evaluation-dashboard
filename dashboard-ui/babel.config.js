module.exports = {
    presets: [
        '@babel/preset-env',     // For modern JavaScript features like async/await
        '@babel/preset-react',   // For transforming JSX syntax (React)
    ],
    plugins: ["@babel/plugin-syntax-dynamic-import"]
};