import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../../_shared/cors.ts";
// import { Resend } from "npm:resend@4.0.0";
// import { renderAsync } from "npm:@react-email/components@0.0.22";
// import React from "npm:react@18.3.1";
// import { BackupNotificationEmail } from "./_templates/backup-notification.tsx";

interface BackupResult {
  success: boolean;
  filename?: string;
  size?: number;
  url?: string;
  error?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    console.log('Starting database backup process...');
    
    // Verify this is a cron request
    const cronHeader = req.headers.get('X-Cron-Source');
    if (!cronHeader || cronHeader !== 'supabase-cron') {
      console.log('Unauthorized: Missing cron header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - cron only' }), 
        { 
          status: 401, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get environment variables
    const awsAccessKey = Deno.env.get('AWS_ACCESS_KEY_ID');
    const awsSecretKey = Deno.env.get('AWS_SECRET_ACCESS_KEY');
    const awsBucket = Deno.env.get('AWS_BUCKET_NAME');
    const awsRegion = Deno.env.get('AWS_REGION') || 'us-east-1';
    const dbUrl = Deno.env.get('SUPABASE_DB_URL');
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!awsAccessKey || !awsSecretKey || !awsBucket || !dbUrl || !resendApiKey) {
      const missing = [];
      if (!awsAccessKey) missing.push('AWS_ACCESS_KEY_ID');
      if (!awsSecretKey) missing.push('AWS_SECRET_ACCESS_KEY'); 
      if (!awsBucket) missing.push('AWS_BUCKET_NAME');
      if (!dbUrl) missing.push('SUPABASE_DB_URL');
      if (!resendApiKey) missing.push('RESEND_API_KEY');
      
      console.error('Missing environment variables:', missing);
      return new Response(
        JSON.stringify({ error: `Missing env vars: ${missing.join(', ')}` }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    const result = await performBackup(dbUrl, awsAccessKey, awsSecretKey, awsBucket, awsRegion);
    
    // Send notification email to admins
    if (result.success) {
      await sendBackupNotification(resendApiKey, result, supabase);
    }

    console.log('Backup process completed:', result);

    return new Response(
      JSON.stringify(result),
      {
        status: result.success ? 200 : 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error('Error in backup function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

async function performBackup(
  dbUrl: string, 
  accessKey: string, 
  secretKey: string, 
  bucket: string, 
  region: string
): Promise<BackupResult> {
  try {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const filename = `${dateStr}.sql.gz`;
    
    console.log(`Creating backup: ${filename}`);

    // Create pg_dump process
    const pgDumpProcess = new Deno.Command('pg_dump', {
      args: [
        dbUrl,
        '--verbose',
        '--no-owner',
        '--no-acl',
        '--clean',
        '--if-exists'
      ],
      stdout: 'piped',
      stderr: 'piped',
    });

    // Create gzip process
    const gzipProcess = new Deno.Command('gzip', {
      args: ['-c'],
      stdin: 'piped',
      stdout: 'piped',
      stderr: 'piped',
    });

    // Start both processes
    const pgDump = pgDumpProcess.spawn();
    const gzip = gzipProcess.spawn();

    // Pipe pg_dump output to gzip input
    await pgDump.stdout.pipeTo(gzip.stdin);

    // Read compressed data
    const compressedData = await gzip.stdout.bytes();
    
    // Wait for processes to complete
    const [pgDumpResult, gzipResult] = await Promise.all([
      pgDump.status,
      gzip.status
    ]);

    if (!pgDumpResult.success) {
      const error = new TextDecoder().decode(await pgDump.stderr.bytes());
      throw new Error(`pg_dump failed: ${error}`);
    }

    if (!gzipResult.success) {
      const error = new TextDecoder().decode(await gzip.stderr.bytes());
      throw new Error(`gzip failed: ${error}`);
    }

    console.log(`Backup created, size: ${compressedData.length} bytes`);

    // Upload to S3
    const s3Url = await uploadToS3(
      compressedData, 
      filename, 
      bucket, 
      region, 
      accessKey, 
      secretKey
    );

    return {
      success: true,
      filename,
      size: compressedData.length,
      url: s3Url
    };

  } catch (error: any) {
    console.error('Backup failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function uploadToS3(
  data: Uint8Array, 
  filename: string, 
  bucket: string, 
  region: string, 
  accessKey: string, 
  secretKey: string
): Promise<string> {
  const url = `https://s3.${region}.amazonaws.com/${bucket}/${filename}`;
  
  // Create AWS signature v4
  const host = `s3.${region}.amazonaws.com`;
  const service = 's3';
  const method = 'PUT';
  const contentType = 'application/gzip';
  
  const now = new Date();
  const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timeStamp = now.toISOString().slice(0, 19).replace(/[-:]/g, '') + 'Z';
  
  // Create canonical request
  const canonicalUri = `/${filename}`;
  const canonicalQueryString = '';
  const canonicalHeaders = `content-type:${contentType}\nhost:${host}\nx-amz-date:${timeStamp}\n`;
  const signedHeaders = 'content-type;host;x-amz-date';
  
  // Create hash of payload
  const encoder = new TextEncoder();
  const hashDataBuffer = new ArrayBuffer(data.byteLength);
  new Uint8Array(hashDataBuffer).set(data);
  const payloadHash = await crypto.subtle.digest('SHA-256', hashDataBuffer);
  const payloadHashHex = Array.from(new Uint8Array(payloadHash))
    .map(b => b.toString(16).padStart(2, '0')).join('');
  
  const canonicalRequest = `${method}\n${canonicalUri}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHashHex}`;
  
  // Create string to sign
  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = `${algorithm}\n${timeStamp}\n${credentialScope}\n` + 
    Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(canonicalRequest))))
      .map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Create signing key
  const kDate = await hmacSha256(encoder.encode(`AWS4${secretKey}`), dateStamp);
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, service);
  const kSigning = await hmacSha256(kService, 'aws4_request');
  
  // Create signature
  const signature = Array.from(new Uint8Array(await hmacSha256(kSigning, stringToSign)))
    .map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Create authorization header
  const authorization = `${algorithm} Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  
  // Make request
  const requestDataBuffer = new ArrayBuffer(data.byteLength);
  new Uint8Array(requestDataBuffer).set(data);
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
      'Host': host,
      'X-Amz-Date': timeStamp,
      'Authorization': authorization,
    },
    body: requestDataBuffer,
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`S3 upload failed: ${response.status} ${errorText}`);
  }
  
  console.log(`Backup uploaded to S3: ${url}`);
  return url;
}

async function hmacSha256(key: Uint8Array, message: string): Promise<Uint8Array> {
  const keyBuffer = new ArrayBuffer(key.byteLength);
  new Uint8Array(keyBuffer).set(key);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(message));
  return new Uint8Array(signature);
}

async function sendBackupNotification(
  resendApiKey: string, 
  result: BackupResult, 
  supabase: any
) {
  try {
    // Get admin users
    const { data: adminUsers } = await supabase
      .from('user_roles')
      .select(`
        user_id,
        profiles (email, name)
      `)
      .eq('role', 'admin');

    if (!adminUsers || adminUsers.length === 0) {
      console.log('No admin users found for notification');
      return;
    }

    // Email functionality disabled - uncomment when dependencies are available
    // const resend = new Resend(resendApiKey);

    // Send email to each admin
    for (const admin of adminUsers) {
      if (admin.profiles?.email) {
        // Simple notification - email functionality disabled
        console.log(`Backup notification would be sent to: ${admin.profiles.email}`);
        console.log(`Backup status: ${result.success ? 'Success' : 'Failed'}`);
        if (result.filename) console.log(`Filename: ${result.filename}`);
        if (result.size) console.log(`Size: ${formatBytes(result.size)}`);
        if (result.url) console.log(`URL: ${result.url}`);
        if (result.error) console.log(`Error: ${result.error}`);
      }
    }
  } catch (error) {
    console.error('Failed to send backup notification:', error);
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

serve(handler);