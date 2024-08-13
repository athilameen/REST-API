const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const awsupload = async (file) => {    

    // Configure the S3 client
    const s3 = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
    });

    // Parameters for S3 upload
    const params = {
        Bucket: process.env.AWS_S3_BUCKET_NAME, // e.g., 'your-bucket-name'
        Key: `products/${Date.now()}-${file.originalname}`, // e.g., 'uploads/timestamp-filename.jpg'
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read', // Adjust as necessary
    };

    try {
        // Uploading to S3
        const command = new PutObjectCommand(params);
        await s3.send(command);
        const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
        const publicURL = signedUrl.split('?');
        return { success: true, url: publicURL[0], message: `File uploaded successfully.` }
    } catch (err) {
        console.error('Error uploading file:', err);
        return { success: false, message: 'Failed to upload file.' }
    }

}

module.exports = awsupload;