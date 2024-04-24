let ip
let IPv4
let IPv6
let info_flag = false

let ngn;
let res;

let connect_status = {}

async function IPv4orIPv6_fetch(url, timeout = 1000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        return false;
    } finally {
        clearTimeout(timeoutId);
    }
}

async function IpInfo(ip) {
    const res = await fetch('/api/get/info', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            ip: ip
        })
    })
    return res
}

async function info() {
    info_flag = true
    let ipInfo = await IpInfo(ip);
    ipInfo = await ipInfo.json();
    $('#ip').text(ip || '-');
    $('#country').text(ipInfo.Country.companyjp || '-');
    $('#location').text(ipInfo.Country.location || '-');
    $('#hostname').text(ipInfo.hostname || '-');
    $('#asn').text(ipInfo.asn || '-');
    $('#company-name').text(ipInfo.companyName || '-');
    $('#isp').text(ipInfo.isp || '-');
}

function NGNCheck(url, id) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            clearTimeout(timeout);
            $(`#${id}`).remove();
            resolve(true);
        };
        img.onerror = () => {
            resolve(false);
        };
        img.src = url;
        img.style.display = 'none';
        img.id = id;

        const timeout = setTimeout(() => {
            img.src = '';
            $(`#${id}`).remove();
            resolve(false);
        }, 1000);

        document.body.appendChild(img);
    });
}

async function v6() {
    const v6 = new Image();
    v6.onload = () => {
        $('#connect-status-ipv4').html('<span class="text-success">V6プラス<br>(IPoE + IPv4 over IPv6)</span>');
        $('#connect-status-ipv6').html('<span class="text-success">V6プラス (IPoE)</span>');
        connect_status.v6 = true
    }
    v6.onerror = () => connect_status.v6 = false
    v6.src = 'https://kiriwake4.jpne.co.jp/addr.cgi?q=img';
    v6.style.display = 'none';
    v6.id = 'v6plus'
    $('#v6plus').remove();
}
async function ocn() {
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (IPv4 !== undefined || IPv6 !== undefined) {
        const response = await fetch('/api/post/ocn', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ipv4: IPv4 || '',
                ipv6: IPv6 || ''
            })
        });
        const data = await response.json();

        if (!data.IPv4) {
            connect_status.ocnIpv4 = false
            connect_status.ocn = false
        }
        else {
            $('#connect-status-ipv4').html(data.IPv4);
            connect_status.ocnIpv4 = true
            connect_status.ocn = true
        }
        if (!data.IPv6) {
            connect_status.ocnIPv6 = false
            connect_status.ocn = false
        }
        else {
            $('#connect-status-ipv6').html(data.IPv6);
            connect_status.ocnIPv6 = true
            connect_status.ocn = true
        }
    }
    else connect_status.ocn = false
}


(async () => {
    const access_ipv4 = '106.185.148.112'
    const access_ipv6 = '240b:253:5660:9600:4c4a:c5ff:fe10:61f6'
    const ipv4Promise = IPv4orIPv6_fetch(`http://${access_ipv4}:4000/api/get/ip`);
    const ipv6Promise = IPv4orIPv6_fetch(`http://[${access_ipv6}]:3000/api/get/ip`);

    ipv4Promise.then(ipv4Data => {
        IPv4 = ipv4Data.IPv4
        $('#ipv4-address').text(ipv4Data && ipv4Data.IPv4 ? ipv4Data.IPv4 : '-');
        $('#ipv4-status').html(ipv4Data && ipv4Data.IPv4 ? '<span class="text-success">〇</span>' : '<span class="text-danger">✕</span>');
    });

    ipv6Promise.then(ipv6Data => {
        IPv6 = ipv6Data.IPv6
        $('#ipv6-address').text(ipv6Data && ipv6Data.IPv6 ? ipv6Data.IPv6 : '-');
        $('#ipv6-status').html(ipv6Data && ipv6Data.IPv6 ? '<span class="text-success">〇</span>' : '<span class="text-danger">✕</span>');
    });

    Promise.all([ipv4Promise, ipv6Promise]).then(results => {
        const [ipv4Data, ipv6Data] = results;
        ip = ipv4Data && ipv4Data.IPv4 ? ipv4Data.IPv4 : ipv6Data && ipv6Data.IPv6 ? ipv6Data.IPv6 : null;
        if(ip) info()
        let infoText = '<span class="text-danger">取得できませんでした</span>';
        if (ipv4Data && ipv4Data.IPv4 && ipv6Data && ipv6Data.IPv6) {
            infoText = '<span class="text-success">IPv4/IPv6の両方で通信しています</span>';
        } else if (ipv4Data && ipv4Data.IPv4) {
            infoText = '<span class="text-success">IPv4のみで通信しています</span>';
        } else if (ipv6Data && ipv6Data.IPv6) {
            infoText = '<span class="text-success">IPv6のみで通信しています</span>';
        }
        $('#connection').html(infoText);
    });

    const ntt_west = NGNCheck('https://www.flets-west.jp/common/images/logo.gif','west');
    const ntt_east = NGNCheck('https://flets-east.jp/separate/sqheader/image/ntt_logo.jpg','east');
    Promise.all([ntt_west, ntt_east]).then(([west, east]) => {
        const ngnProvider = west && east
        ? '<span class="text-success">〇 NTT 東西のNGNにアクセスできます</span>'
        : (west ? '<span class="text-success">〇 NTT 西日本</span>' : (east ? '<span class="text-success">〇 NTT 東日本</span>' : '<span class="text-danger">✕ NGN網に接続できませんでした</span>'));
    
    $('#ngn-status').html(ngnProvider);
    })
    .catch((error) => {
        console.error(error);
    });
    await v6();
    await ocn();
    const connect_status_flag = Object.values(connect_status).every(value => value === false);
    if (connect_status_flag) {
        $('#connect-status-ipv4').html('測定不可<br>全てのプロバイダーに対応しておりません');
        $('#connect-status-ipv6').html('測定不可<br>全てのプロバイダーに対応しておりません');
    }
})();