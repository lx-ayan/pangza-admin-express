import path from "path"

function resolve(url: string) {
    return path.resolve(__dirname, `../${url}`);
}

const alias = {
    '@': resolve('src'),
    '@assets': resolve('src/assets'),
}


export default alias