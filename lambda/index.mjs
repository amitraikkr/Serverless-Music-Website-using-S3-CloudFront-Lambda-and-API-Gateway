import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const bucketName = 'christmasmusic2024';
const REGION = 'us-east-2';  // Replace with your bucket's region

// Initialize the S3 client
const s3Client = new S3Client({ region: REGION });

// Function to generate pre-signed URL for a given object key
const generatePresignedUrl = async (key, expiresIn = 3600) => {
    try {
        const url = await getSignedUrl(s3Client, new GetObjectCommand({
            Bucket: bucketName,
            Key: key
        }), { expiresIn });
        return url;
    } catch (error) {
        console.error('Error generating pre-signed URL:', error);
        return null;
    }
};

// Lambda handler function
export const handler = async (event) => {
    try {
        // Get 'language' query parameter from the event
        const language = event.queryStringParameters ? event.queryStringParameters.language : 'english';
        
        // Ensure language folder is in lowercase (e.g., 'english', 'hindi', 'punjabi')
        const folderPrefix = `${language.toLowerCase()}/`;  // Match the actual folder name

        console.log("Listing objects with prefix:", folderPrefix);

        // List objects from the S3 bucket for the given language folder
        const listParams = {
            Bucket: bucketName,
            Prefix: folderPrefix
        };

        const data = await s3Client.send(new ListObjectsV2Command(listParams));

        console.log("S3 Data:", data);

        // If there are no contents, return an empty list
        if (!data.Contents || data.Contents.length === 0) {
            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                },
                body: JSON.stringify([])
            };
        }

        // Generate pre-signed URLs for each song using GetObjectCommand
        const songs = await Promise.all(
            data.Contents.map(async (item) => {
                const songName = decodeURIComponent(item.Key.split('/').pop());  // Extract song name
                if (!songName) return null;  // Skip empty folder keys
                const url = await generatePresignedUrl(item.Key);
                return {
                    name: songName,
                    url
                };
            })
        );

        // Filter out any null values from the song list
        const filteredSongs = songs.filter(Boolean);

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            body: JSON.stringify(filteredSongs)
        };

    } catch (err) {
        console.error('Error fetching songs:', err);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            body: JSON.stringify({ error: 'Error fetching songs', message: err.message })
        };
    }
};