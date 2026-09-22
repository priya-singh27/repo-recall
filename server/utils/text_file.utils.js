const BINARY_EXTENSIONS = new Set([
    "png", "jpg", "jpeg", "gif", "webp", "ico", "bmp", "tif", "tiff", "avif", "heic",
    "mp3", "mp4", "wav", "ogg", "webm", "mov", "avi", "mkv",
    "woff", "woff2", "ttf", "otf", "eot",
    "zip", "gz", "tgz", "tar", "rar", "7z", "bz2",
    "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
    "exe", "dll", "so", "dylib", "bin", "wasm", "class", "jar",
    "pyc", "pyo",
]);

const isTextFile = (path) => {
    const base = String(path).split("/").pop() || "";
    if (base === ".DS_Store") return false;

    const dot = base.lastIndexOf(".");
    if (dot <= 0) return true;

    const ext = base.slice(dot + 1).toLowerCase();
    return !BINARY_EXTENSIONS.has(ext);
};

module.exports = { isTextFile };
