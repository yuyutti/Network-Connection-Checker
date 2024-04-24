const fs = require('fs').promises;
const express = require('express');
const cors = require('cors');
const requestIp = require('request-ip');
const cheerio = require('cheerio');
require('dotenv').config()

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static('public'));
app.use(requestIp.mw());

let countriesData;

(async () => {
    const countries = await fs.readFile('country.json', 'utf8');
    countriesData = JSON.parse(countries);
})();

async function country(countryCode) {
    const country = countriesData.find(country => country.alpha2 === countryCode);
    return country ? { companyjp: country.companyjp, location: country.location } : null;
}

// IPv4 IPv6接続テスト //

app.get('/api/get/ip', (req, res) => {
    const ipAddress = req.socket.remoteAddress;
    
    const cleanIp = ipAddress.replace(/^.*:/, '');

    const isIPv4 = cleanIp.match(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/) != null;
    const isIPv6 = ipAddress.includes(':') && !isIPv4;

    const clientPort = req.socket.remotePort;
    const data = {
        IPv4: isIPv4 ? cleanIp : false,
        IPv6: isIPv6 ? ipAddress : false,
        clientPort: clientPort
    }
    console.log(data)
    res.json(data);
});

// その他診断 //

app.post('/api/get/info', async(req,res) => {
    const info = await fetch(`https://ipinfo.io/${req.body.ip}?token=${process.env.TOKEN}`);
    const info_response = await info.json();
    const CountryName = await country(info_response.country);
    
    const org = info_response.org.indexOf(' ');
    const asn = info_response.org.substring(0, org).trim();
    const companyName = info_response.org.substring(org + 1).trim();

    const replaceAS = asn.replace('AS', '');
    const ASNumber = parseInt(replaceAS, 10);
    const isp = await fetch(`https://api.asrank.caida.org/v2/restful/asns/${ASNumber}`)
    const isp_response = await isp.json();
    const ispName = isp_response.data.asn.asnName

    const data = {
        Country: CountryName,
        hostname: info_response.hostname ? info_response.hostname : null,
        asn,
        companyName,
        isp: ispName
    }
    res.json(data)
})

app.post('/api/get/ocn', async(req,res) => {
    const data = req.body
    const response = await fetch('https://v6test.ocn.ne.jp/check', {
        method: 'POST',
        headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
        },
        body: `ipv4=${encodeURIComponent(data.ipv4)}&ipv6=${encodeURIComponent(data.ipv6)}`
    });
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const ipv4Connection = $('.ipv4_btn').closest('tr').find('td').first().text().trim();
    const ipv6Connection = $('.ipv6_btn').closest('tr').find('td').first().text().trim();

    let ipv4Text;
    if (ipv4Connection === 'PPPoE方式') {
        ipv4Text = '<span class="text-success">OCN (PPPoE)</span>';
    } else if (ipv4Connection === 'IPoE形式') {
        ipv4Text = '<span class="text-success">OCNバーチャルコネクト (IPoE + IPv4 over IPv6)</span>';
    } else {
        ipv4Text = false;
    }

    let ipv6Text;
    if (ipv6Connection === 'PPPoE方式') {
        ipv6Text = '<span class="text-success">OCN (PPPoE)</span>';
    } else if (ipv6Connection === 'IPoE形式') {
        ipv6Text = '<span class="text-success">OCNバーチャルコネクト (IPoE)</span>';
    } else {
        ipv6Text = false;
    }

    const resData = {
        IPv4: ipv4Text,
        IPv6: ipv6Text
    }

    res.send(resData);
})

app.listen(4545, '::', () => console.log(`IPv6 server running on port 3000`));