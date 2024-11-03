const dns = require('dns');
const tls = require('tls');
const https = require('https');
const net = require('net');
const axios = require('axios');

function dnsLookup(domain) {
    return new Promise((resolve, reject) => {
        const results = {};
        dns.resolve4(domain, (error, aRecords) => {
            if (!error) results.aRecords = aRecords;
            dns.resolve6(domain, (error, aaaaRecords) => {
                if (!error) results.aaaaRecords = aaaaRecords;
                dns.resolveNs(domain, (error, nsRecords) => {
                    if (!error) results.nsRecords = nsRecords;
                    dns.resolveSoa(domain, (error, soaRecord) => {
                        if (!error) results.soaRecord = soaRecord;
                        dns.resolveMx(domain, (error, mxRecords) => {
                            if (!error) results.mxRecords = mxRecords;
                            dns.resolveCaa(domain, (error, caaRecords) => {
                                if (!error) results.caaRecords = caaRecords;
                                dns.resolveTxt(domain, (error, txtRecords) => {
                                    if (!error) results.txtRecords = txtRecords;
                                    resolve(results);
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}

function sslLookup(domain) {
    return new Promise((resolve, reject) => {
        const options = {
            host: domain,
            port: 443,
            rejectUnauthorized: false
        };
        const socket = tls.connect(options, () => {
            const certificate = socket.getPeerCertificate();
            if (!certificate || Object.keys(certificate).length === 0) {
                reject(new Error('Could not retrieve certificate'));
            } else {
                const formattedCertificate = `*Result SSL Lookup*\n\n` +
					`- Domain:\n> ${domain}\n` +
					`- Subject:\n> ${certificate.subject ? JSON.stringify(certificate.subject) : 'N/A'}\n` +
					`- Issuer:\n> ${certificate.issuer ? JSON.stringify(certificate.issuer) : 'N/A'}\n` +
					`- Valid From:\n> ${certificate.valid_from ? certificate.valid_from : 'N/A'}\n` +
					`- Valid To:\n> ${certificate.valid_to ? certificate.valid_to : 'N/A'}\n` +
					`- Serial Number:\n> ${certificate.serialNumber ? certificate.serialNumber : 'N/A'}`;
				resolve(formattedCertificate);
            }
            socket.end();
        });
        socket.on('error', (error) => {
            reject(error);
        });
    });
}

function httpHeadersLookup(domain) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: domain,
            port: 443,
            path: '/',
            method: 'GET',
            rejectUnauthorized: false 
        };
        const req = https.request(options, (res) => {
            let headers = res.headers;
            let formattedHeaders = '*Result HTTP Headers Lookup*\n\n';
            for (const [key, value] of Object.entries(headers)) {
                formattedHeaders += `- ${key}\n> ${value}\n`;
            }
            resolve(formattedHeaders);
        });
        req.on('error', (error) => {
            reject(error);
        });
        req.end();
    });
}

async function CheckVulnerability(domain) {
    let score = 100;

    const checkSSL = async () => {
        return new Promise((resolve) => {
            const req = https.request({ host: domain, method: 'GET' }, (res) => {
                const certificate = res.connection.getPeerCertificate();
                if (!certificate || !certificate.valid_to) {
                    score -= 10;
                    resolve(`SSL Certificate\n> Invalid or not found.`);
                } else {
                    resolve(`SSL Certificate\n> ${certificate.valid_to}.`);
                }
            });

            req.on('error', () => {
                score -= 10;
                resolve(`SSL Certificate\n> Unable to connect or invalid.`);
            });
            req.end();
        });
    };

    const checkSecurityHeaders = async () => {
        try {
            const response = await axios.get(`https://${domain}`);
            const headers = response.headers;
            const missingHeaders = [];

            if (!headers['x-frame-options']) missingHeaders.push('X-Frame-Options');
            if (!headers['x-xss-protection']) missingHeaders.push('X-XSS-Protection');
            if (!headers['x-content-type-options']) missingHeaders.push('X-Content-Type-Options');
            if (!headers['content-security-policy']) missingHeaders.push('Content-Security-Policy');

            if (missingHeaders.length > 0) {
                score -= missingHeaders.length * 5;
                return `Missing Security Header\n> ${missingHeaders.join(', ')}.`;
            }
            return `Security Headers\n> All main headers are secure.`;
        } catch {
            score -= 5;
            return `Security Header\n> Inaccessible.`;
        }
    };

    const scanPorts = async () => {
        const ports = [80, 443, 8080, 8443];
        const openPorts = [];
        
        await Promise.all(ports.map(port => {
            return new Promise(resolve => {
                const socket = new net.Socket();
                socket.setTimeout(1000);
                socket.on('connect', () => {
                    openPorts.push(port);
                    socket.destroy();
                    resolve();
                }).on('timeout', () => {
                    socket.destroy();
                    resolve();
                }).on('error', () => resolve()).connect(port, domain);
            });
        }));

        if (openPorts.length > 0) {
            score -= openPorts.length * 5;
            return `Open Ports\n> ${openPorts.join(', ')}.`;
        }
        return `Open Ports\n> No public ports open.`;
    };

    const checkSQLInjection = async () => {
        try {
            const response = await axios.get(`https://${domain}/?id=1' OR '1'='1`);
            if (response.status === 200 && response.data.includes('SQL')) {
                score -= 10;
                return `SQL Injection\n> May be vulnerable.`;
            }
            return `SQL Injection\n> Not detected.`;
        } catch {
            return `SQL Injection\n> Not detected.`;
        }
    };

    const checkOpenRedirect = async () => {
        try {
            const redirectUrl = `https://${domain}/?redirect=https://malicious.com`;
            const response = await axios.get(redirectUrl, { maxRedirects: 0 });
            if (response.status === 302) {
                score -= 10;
                return `Open Redirect\n> Vulnerable to open redirects.`;
            }
            return `Open Redirect\n> Not vulnerable.`;
        } catch {
            return `Open Redirect\n> Not vulnerable.`;
        }
    };

    const checkDirectoryTraversal = async () => {
        try {
            const response = await axios.get(`https://${domain}/../../../../etc/passwd`);
            if (response.status === 200 && response.data.includes('root:')) {
                score -= 10;
                return `Directory Traversal\n> Prone.`;
            }
            return `Directory Traversal\n> Not detected.`;
        } catch {
            return `Directory Traversal\n> Not detected.`;
        }
    };

    const checkXSS = async () => {
        try {
            const xssPayload = `<script>alert('XSS')</script>`;
            const response = await axios.get(`https://${domain}/?q=${encodeURIComponent(xssPayload)}`);
            if (response.status === 200 && response.data.includes(xssPayload)) {
                score -= 10;
                return `XSS\n> Prone.`;
            }
            return `XSS\n> Not detected.`;
        } catch {
            return `XSS\n> Not detected.`;
        }
    };

    const checkSubdomains = async () => {
        const subdomains = ['www', 'api', 'test', 'dev'];
        const foundSubdomains = [];
        
        await Promise.all(subdomains.map(sub => {
            return new Promise(resolve => {
                https.get(`https://${sub}.${domain}`, res => {
                    if (res.statusCode === 200) {
                        foundSubdomains.push(`${sub}.${domain}`);
                    }
                    resolve();
                }).on('error', () => resolve());
            });
        }));

        if (foundSubdomains.length > 0) {
            score -= foundSubdomains.length * 2;
            return `Open Subdomains\n> ${foundSubdomains.join(', ')}.`;
        }
        return `Open Subdomains\n> Not detected.`;
    };

    const results = await Promise.all([
        checkSSL(),
        checkSecurityHeaders(),
        scanPorts(),
        checkSQLInjection(),
        checkOpenRedirect(),
        checkDirectoryTraversal(),
        checkXSS(),
        checkSubdomains()
    ]);

    const finalScore = Math.max(0, score);
    const securityLevel = `Security Level\n> ${finalScore}%\n`;
    return securityLevel + results.join('\n');
}

module.exports = { dnsLookup, sslLookup, httpHeadersLookup, CheckVulnerability };
