module.exports = process.env.REACT_APP_TESTING ? {
    presets: [
        '@babel/preset-env',     // For modern JavaScript features like async/await
        '@babel/preset-react',   // For transforming JSX syntax (React)
    ]
} : {};