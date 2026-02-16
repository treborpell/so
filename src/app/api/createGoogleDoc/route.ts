import { google } from 'googleapis';
import { NextResponse } from 'next/server';

// Specifies the credentials for the service account
const CREDENTIALS = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS || '{}');

// Specifies the scopes required for the Google Docs and Drive APIs
const SCOPES = ['https://www.googleapis.com/auth/documents', 'https://www.googleapis.com/auth/drive.file'];

export async function POST(req: Request) {
  try {
    const { title } = await req.json();

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // 1. Authenticate with Google
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: CREDENTIALS.client_email,
        private_key: CREDENTIALS.private_key.replace(/\\n/g, '\n'),
      },
      scopes: SCOPES,
    });

    // The 'auth' object can be passed directly to the API clients.
    // It will automatically handle fetching the access token.
    const docs = google.docs({ version: 'v1', auth });
    const drive = google.drive({ version: 'v3', auth });

    // 2. Create the Google Doc
    const doc = await docs.documents.create({
        requestBody: {
            title: title,
        },
    });

    const documentId = doc.data.documentId;

    if (!documentId) {
        throw new Error("Failed to create document");
    }

    // 3. Set permissions to make it publicly readable
    await drive.permissions.create({
        fileId: documentId,
        requestBody: {
            role: 'reader',
            type: 'anyone',
        },
    });

    // 4. Get the document's URL
    const file = await drive.files.get({
        fileId: documentId,
        fields: 'webViewLink',
    });

    return NextResponse.json({
        message: 'Google Doc created successfully',
        documentId: documentId,
        url: file.data.webViewLink
    });

  } catch (error) {
    console.error('Error creating Google Doc:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    // Provide more context on auth errors
    if (errorMessage.includes('credential')) {
        return NextResponse.json({ error: 'Authentication Failed', details: 'Please check your GOOGLE_APPLICATION_CREDENTIALS environment variable.' }, { status: 500 });
    }
    return NextResponse.json({ error: 'Failed to create Google Doc', details: errorMessage }, { status: 500 });
  }
}
