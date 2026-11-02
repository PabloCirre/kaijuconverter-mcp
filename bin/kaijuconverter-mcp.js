#!/usr/bin/env node
/**
 * Official @kaijuconverter/mcp-server (v1.1.0)
 * Zero-dependency stdio Model Context Protocol (MCP) Server & CLI for KaijuConverter.com
 * Supports 201+ file formats & 54 Studio workspaces across 12 languages.
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');

const SERVER_NAME = 'kaijuconverter-mcp';
const SERVER_VERSION = '1.1.0';
const BASE_URL = (process.env.KAIJU_BASE_URL || 'https://kaijuconverter.com').replace(/\/+$/, '');
const API_KEY = process.env.KAIJU_API_KEY || '';
const USER_AGENT = `Mozilla/5.0 (compatible; KaijuConverterMCP/${SERVER_VERSION}; +https://kaijuconverter.com/integrations)`;

function buildHeaders(extra = {}) {
    const h = {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
        ...extra,
    };
    if (API_KEY) {
        h['Authorization'] = `Bearer ${API_KEY}`;
    }
    return h;
}

async function callRemoteMcpTool(name, args) {
    const res = await fetch(`${BASE_URL}/api/mcp`, {
        method: 'POST',
        headers: buildHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: Date.now(),
            method: 'tools/call',
            params: { name, arguments: args || {} },
        }),
    });
    if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`Remote MCP HTTP ${res.status}: ${txt.slice(0, 300)}`);
    }
    const rpc = await res.json();
    if (rpc.error) {
        throw new Error(rpc.error.message || JSON.stringify(rpc.error));
    }
    return rpc.result;
}

async function convertLocalFile(args) {
    const inputPath = path.resolve(String(args.input_path || ''));
    const targetFormat = String(args.target_format || '').trim().replace(/^\./, '').toLowerCase();

    if (!args.input_path || !targetFormat) {
        throw new Error('Both input_path and target_format are required.');
    }
    if (!fs.existsSync(inputPath) || !fs.statSync(inputPath).isFile()) {
        throw new Error(`Local file not found: ${inputPath}`);
    }

    const fileBytes = fs.readFileSync(inputPath);
    const fileName = path.basename(inputPath);
    const form = new FormData();
    form.append('file', new Blob([fileBytes]), fileName);
    form.append('target_format', targetFormat);
    if (args.quality) form.append('quality', String(args.quality));
    if (args.preset) form.append('preset', String(args.preset));
    if (args.max_output_bytes) form.append('max_output_bytes', String(args.max_output_bytes));

    const res = await fetch(`${BASE_URL}/api/mcp/upload`, {
        method: 'POST',
        headers: buildHeaders(),
        body: form,
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || !data || data.error) {
        throw new Error((data && (data.error || data.message)) || `Upload conversion failed (HTTP ${res.status})`);
    }

    let savedOutputPath = null;
    if (args.save_to_disk !== false && data.download_url) {
        const defaultOut = path.join(
            path.dirname(inputPath),
            `${path.basename(inputPath, path.extname(inputPath))}.${data.target_format || targetFormat}`
        );
        let destPath = args.output_path ? path.resolve(String(args.output_path)) : defaultOut;
        if (!args.output_path && destPath === inputPath) {
            destPath = path.join(
                path.dirname(inputPath),
                `${path.basename(inputPath, path.extname(inputPath))}.converted.${data.target_format || targetFormat}`
            );
        }
        const dlRes = await fetch(data.download_url, { headers: buildHeaders({ 'Accept': '*/*' }) });
        if (!dlRes.ok) {
            throw new Error(`Converted file download failed (HTTP ${dlRes.status})`);
        }
        const outBuf = Buffer.from(await dlRes.arrayBuffer());
        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        fs.writeFileSync(destPath, outBuf);
        savedOutputPath = destPath;
    }

    const payload = {
        ...data,
        input_path: inputPath,
        saved_output_path: savedOutputPath,
    };

    return {
        content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
        structuredContent: payload,
        isError: false,
    };
}

const LOCAL_TOOLS = [
    {
        name: 'convert_local_file',
        description: 'Convert a local file on disk to any of 201+ supported formats using KaijuConverter and save the converted output directly to local disk (with SHA-256 verification and 60-min GDPR server auto-purge).',
        inputSchema: {
            type: 'object',
            required: ['input_path', 'target_format'],
            properties: {
                input_path: {
                    type: 'string',
                    description: 'Path to the local source file on disk (e.g. "/Users/me/photo.heic" or "./report.docx").',
                },
                target_format: {
                    type: 'string',
                    description: 'Target extension without dot (e.g. "jpg", "webp", "png", "pdf", "docx", "xlsx", "mp4", "mp3").',
                },
                output_path: {
                    type: 'string',
                    description: 'Optional destination path on local disk. Defaults to same directory with new extension.',
                },
                save_to_disk: {
                    type: 'boolean',
                    description: 'Whether to download and write the converted file to local disk (default: true).',
                },
                quality: {
                    type: 'integer',
                    minimum: 1,
                    maximum: 100,
                    description: 'Optional output quality (1-100).',
                },
                preset: {
                    type: 'string',
                    enum: ['web', 'email', 'whatsapp', 'print', 'archive'],
                },
                max_output_bytes: {
                    type: 'integer',
                    description: 'Optional strict byte cap for images (e.g. 20000 for <=20KB, 50000 for <=50KB).',
                },
            },
        },
    },
    {
        name: 'convert_file_from_url',
        description: 'Download a public HTTPS file URL and convert it to any of 201+ supported formats, returning a direct download URL and SHA-256 checksum.',
        inputSchema: {
            type: 'object',
            required: ['file_url', 'target_format'],
            properties: {
                file_url: { type: 'string', description: 'Public HTTPS URL of the source file.' },
                target_format: { type: 'string', description: 'Target extension without dot (e.g. "webp", "pdf", "png").' },
                filename: { type: 'string', description: 'Optional source filename hint.' },
                quality: { type: 'integer', minimum: 1, maximum: 100 },
                preset: { type: 'string', enum: ['web', 'email', 'whatsapp', 'print', 'archive'] },
            },
        },
    },
    {
        name: 'list_supported_formats',
        description: 'List all 201+ file formats supported by KaijuConverter grouped by family.',
        inputSchema: {
            type: 'object',
            properties: {
                family: { type: 'string', description: 'Optional family slug (image, document, video, audio, archive, ebook, vector, cad).' },
            },
        },
    },
    {
        name: 'get_conversion_targets',
        description: 'List all verified target formats and Studio URLs for a given source extension (across 12 locales).',
        inputSchema: {
            type: 'object',
            required: ['source_format'],
            properties: {
                source_format: { type: 'string', description: 'Source extension without dot (e.g. "heic", "pdf", "cr2").' },
                locale: { type: 'string', description: 'Optional locale: en, es, pt, de, fr, ja, it, id, tr, ko, pl, nl.' },
            },
        },
    },
    {
        name: 'find_studio_tool',
        description: 'Search KaijuConverter’s 54 specialized Studio workspaces (<=20KB/50KB image cap, PDF merge/split/OCR/PDF-A, CM resizer, video-to-GIF).',
        inputSchema: {
            type: 'object',
            properties: {
                query: { type: 'string', description: 'Optional search keyword.' },
                locale: { type: 'string', description: 'Optional locale code.' },
            },
        },
    },
];

async function handleRpc(msg) {
    if (!msg || typeof msg !== 'object') return null;
    const hasId = Object.prototype.hasOwnProperty.call(msg, 'id');
    const method = String(msg.method || '');
    if (!hasId || method.startsWith('notifications/')) {
        return null;
    }
    const id = msg.id;
    const params = msg.params || {};

    try {
        if (method === 'initialize') {
            const clientProto = params.protocolVersion || '2024-11-05';
            const supported = ['2025-03-26', '2024-11-05', '2024-10-07'];
            return {
                jsonrpc: '2.0',
                id,
                result: {
                    protocolVersion: supported.includes(clientProto) ? clientProto : '2024-11-05',
                    capabilities: { tools: { listChanged: false } },
                    serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
                    instructions: 'Use convert_local_file to convert local files on disk (201+ formats) or convert_file_from_url for remote HTTPS files.',
                },
            };
        }
        if (method === 'ping') {
            return { jsonrpc: '2.0', id, result: {} };
        }
        if (method === 'tools/list') {
            return { jsonrpc: '2.0', id, result: { tools: LOCAL_TOOLS } };
        }
        if (method === 'resources/list') {
            return { jsonrpc: '2.0', id, result: { resources: [] } };
        }
        if (method === 'prompts/list') {
            return { jsonrpc: '2.0', id, result: { prompts: [] } };
        }
        if (method === 'tools/call') {
            const toolName = String(params.name || '');
            const toolArgs = params.arguments || {};
            let result;
            if (toolName === 'convert_local_file') {
                result = await convertLocalFile(toolArgs);
            } else {
                result = await callRemoteMcpTool(toolName, toolArgs);
            }
            return { jsonrpc: '2.0', id, result };
        }
        return {
            jsonrpc: '2.0',
            id,
            error: { code: -32601, message: `Method not found: ${method}` },
        };
    } catch (err) {
        return {
            jsonrpc: '2.0',
            id,
            result: {
                isError: true,
                content: [{ type: 'text', text: `KaijuConverter MCP error: ${err.message || String(err)}` }],
            },
        };
    }
}

async function runCli(argv) {
    if (argv.includes('--help') || argv.includes('-h')) {
        process.stdout.write(
            `KaijuConverter Official MCP Server & CLI v${SERVER_VERSION}\n` +
            `Docs: https://kaijuconverter.com/integrations\n\n` +
            `Usage:\n` +
            `  kaijuconverter-mcp                                  Start stdio MCP server (Claude / Cursor / Windsurf / Antigravity)\n` +
            `  kaijuconverter-mcp --convert <in> <ext> [outPath]   Convert a local file directly from terminal\n` +
            `  kaijuconverter-mcp --formats [family]               List 201+ supported formats\n`
        );
        return;
    }

    const convIdx = argv.indexOf('--convert');
    if (convIdx !== -1) {
        const inputPath = argv[convIdx + 1];
        const targetFormat = argv[convIdx + 2];
        const outputPath = argv[convIdx + 3];
        if (!inputPath || !targetFormat) {
            process.stderr.write('Error: --convert requires <inputPath> <targetFormat> [outputPath]\n');
            process.exit(1);
        }
        const res = await convertLocalFile({
            input_path: inputPath,
            target_format: targetFormat,
            ...(outputPath ? { output_path: outputPath } : {}),
        });
        process.stdout.write(JSON.stringify(res.structuredContent, null, 2) + '\n');
        return;
    }

    const fmtIdx = argv.indexOf('--formats');
    if (fmtIdx !== -1) {
        const fam = argv[fmtIdx + 1];
        const res = await callRemoteMcpTool('list_supported_formats', fam ? { family: fam } : {});
        process.stdout.write((res.content && res.content[0] ? res.content[0].text : JSON.stringify(res)) + '\n');
        return;
    }
}

function startStdioServer() {
    let buffer = Buffer.alloc(0);
    let useHeaderFraming = false;

    const sendResponse = (obj) => {
        if (!obj) return;
        const json = JSON.stringify(obj);
        if (useHeaderFraming) {
            const byteLen = Buffer.byteLength(json, 'utf8');
            process.stdout.write(`Content-Length: ${byteLen}\r\n\r\n${json}`);
        } else {
            process.stdout.write(json + '\n');
        }
    };

    const processBuffer = () => {
        while (buffer.length > 0) {
            const str = buffer.toString('utf8');
            if (str.startsWith('Content-Length:')) {
                useHeaderFraming = true;
                const sepIdx = buffer.indexOf('\r\n\r\n');
                if (sepIdx === -1) return;
                const headerStr = buffer.subarray(0, sepIdx).toString('utf8');
                const m = headerStr.match(/Content-Length:\s*(\d+)/i);
                if (!m) {
                    buffer = buffer.subarray(sepIdx + 4);
                    continue;
                }
                const bodyLen = parseInt(m[1], 10);
                const totalLen = sepIdx + 4 + bodyLen;
                if (buffer.length < totalLen) return;
                const rawJson = buffer.subarray(sepIdx + 4, totalLen).toString('utf8');
                buffer = buffer.subarray(totalLen);
                try {
                    const parsed = JSON.parse(rawJson);
                    Promise.resolve(handleRpc(parsed)).then(sendResponse);
                } catch (e) {}
            } else {
                const nlIdx = buffer.indexOf('\n');
                if (nlIdx === -1) return;
                const line = buffer.subarray(0, nlIdx).toString('utf8').trim();
                buffer = buffer.subarray(nlIdx + 1);
                if (!line) continue;
                try {
                    const parsed = JSON.parse(line);
                    Promise.resolve(handleRpc(parsed)).then(sendResponse);
                } catch (e) {}
            }
        }
    };

    process.stdin.on('data', (chunk) => {
        buffer = Buffer.concat([buffer, chunk]);
        processBuffer();
    });
}

const cliArgs = process.argv.slice(2);
if (cliArgs.some(a => ['--help', '-h', '--convert', '--formats'].includes(a))) {
    runCli(cliArgs).catch((err) => {
        process.stderr.write(`Error: ${err.message || String(err)}\n`);
        process.exit(1);
    });
} else {
    startStdioServer();
}
