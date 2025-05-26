import fs from 'fs';
import path from 'path';

// 指定要扫描的目录
const postsDir = "E:\\vscodeProject\\fuwari_astro_blog\\src\\content\\posts"
// 用于存储文件名和图片地址的对象
const fileImageMap = new Map();

// 读取目录中的所有文件
const files = fs.readdirSync(postsDir);

// 遍历所有文件
files.forEach(file => {
    if (path.extname(file) === '.md') {
        const filePath = path.join(postsDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const images = new Set();

        // 匹配 Markdown 图片语法 ![alt](url) 和 HTML 图片标签 <img src="url">
        const markdownImageRegex = /!\[.*?\]\((.*?)\)/g;
        const htmlImageRegex = /<img[^>]+src="([^">]+)"/g;

        let match;

        // 查找 Markdown 格式的图片
        while ((match = markdownImageRegex.exec(content)) !== null) {
            images.add(match[1]);
        }

        // 查找 HTML 格式的图片
        while ((match = htmlImageRegex.exec(content)) !== null) {
            images.add(match[1]);
        }

        // 如果文件包含图片，则添加到映射中
        if (images.size > 0) {
            fileImageMap.set(file, Array.from(images));
        }
    }
});

// 将结果转换为对象格式
const result = Object.fromEntries(fileImageMap);
// 将结果转换为对象格式，只保留图片名称
const result1 = Object.fromEntries(
    Array.from(fileImageMap.entries()).map(([file, images]) => [
        file,
        images.map(url => {
            // 从URL中提取文件名
            const fileName = url.split('/').pop();
            return fileName;
        })
    ])
);
// 将结果转换为对象格式，去掉.md后缀
const result2 = Object.fromEntries(
    Array.from(fileImageMap.entries()).map(([file, images]) => [
        file.replace('.md', ''),
        images.map(url => {
            // 从URL中提取文件名
            const fileName = url.split('/').pop();
            return fileName;
        })
    ])
);
console.log(result2);
