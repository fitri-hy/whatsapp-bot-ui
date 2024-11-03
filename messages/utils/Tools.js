const dns = require('dns');
const tls = require('tls');
const https = require('https');

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

module.exports = { dnsLookup, sslLookup, httpHeadersLookup };
