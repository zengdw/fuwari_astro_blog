import { S3Client, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

// 配置 R2 客户端
const r2Client = new S3Client({
    region: 'auto', // Cloudflare R2 使用 'auto' 作为区域
    endpoint: 'https://a644f161c535108ca84600b4a7712865.r2.cloudflarestorage.com', // 替换为你的账户ID
    credentials: {
        accessKeyId: '704b007fc80dd3c7dfd7582a61528eb6',     // 替换为你的 R2 Access Key ID
        secretAccessKey: 'cbe784a2a062b4a1e320e8ef0de67f5cee0a949c19d78c3d70c4693fec4eb0bf', // 替换为你的 R2 Secret Access Key
    },
    // 禁用区域重定向，R2 需要这个设置
    forcePathStyle: true,
});

// 删除 R2 存储桶中的图片
async function deleteImagesFromR2() {
    try {
        // 列出存储桶中的所有对象
        const listCommand = new ListObjectsV2Command({
            Bucket: 'blog-images'
        });

        const listedObjects = await r2Client.send(listCommand);

        if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
            console.log('存储桶为空');
            return;
        }

        // 删除所有对象
        for (const object of listedObjects.Contents) {
            const deleteCommand = new DeleteObjectCommand({
                Bucket: 'blog-images',
                Key: object.Key
            });

            await r2Client.send(deleteCommand);
            console.log(`已删除: ${object.Key}`);
        }

        console.log('所有图片已成功删除');
    } catch (error) {
        console.error('删除图片时出错:', error);
        throw error;
    }
}


// 上传文件到 R2 存储桶
async function uploadFileToR2(filePath, key) {
    try {
        const fileContent = fs.readFileSync(filePath);
        const command = new PutObjectCommand({
            Bucket: 'blog-images',
            Key: key,
            Body: fileContent,
            ContentType: 'image/png', // 根据实际文件类型调整
        });

        const response = await r2Client.send(command);
        console.log(`文件 ${key} 上传成功`);
        return response;
    } catch (error) {
        console.error(`上传文件 ${key} 时出错:`, error);
        throw error;
    }
}


const json = {
    'skywalking安装使用': [
        'image-20200922155624650.png',
        'image-20200922161543029.png',
        'image-20200922161820052.png',
        'image-20200922161919461.png',
        'image-20200922162750191.png',
        'image-20200922162129431.png',
        'image-20200922170014378.png'
    ],
    'solr-在tomcat中部署': ['solr-add-core.png'],
    '修改powerDesigner生成mysql关键字默认双引号问题': ['image-20200923105250753.png', 'image-20200923105447615.png']
}

// 读取图片文件夹
const imagesDir = 'C:\\Users\\zengd\\Desktop\\images';
const imageFiles = fs.readdirSync(imagesDir);

// 遍历所有图片文件
for (const imageFile of imageFiles) {
    // 遍历json对象查找匹配的key
    for (const [key, images] of Object.entries(json)) {
        if (images.includes(imageFile)) {
            // 构建完整的文件路径
            const filePath = path.join(imagesDir, imageFile);
            // 构建R2存储的key
            const r2Key = `${key}/${imageFile}`;
            // 上传文件
            await uploadFileToR2(filePath, r2Key);
        }
    }
}


