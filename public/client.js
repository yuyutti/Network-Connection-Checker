let ip
let IPv4
let IPv6
let info_flag = false

let ngn;
let res;

let connect_status = {}

async function getData(url, timeout = 1000) {
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


async function info(ipv6Data) {
    info_flag = true
    let ipInfo = await IpInfo(ip);
    ipInfo = await ipInfo.json();
    $('#ip').text(ip || '-');
    $('#country').text(ipInfo.Country.companyjp + '(' + ipv6Data.country_name + ')' || '-');
    $('#location').text(ipInfo.Country.location || '-');
    $('#hostname').text(ipInfo.hostname || '-');
    $('#asn').text(ipv6Data.asn || '-');
    $('#company-name').text(ipv6Data.org || '-');
    $('#isp').text(ipInfo.isp || '-');
}


(async () => {
    const GetIPv4 = IPfetch(`https://ipv4.iplocation.net/`);
    const GetIPv6 = IPfetch(`https://ipapi.co/json/`);

    GetIPv4.then(ipv4Data => {
        IPv4 = ipv4Data.ip
        $('#ipv4-address').text(ipv4Data && ipv4Data.ip ? ipv4Data.ip : '-');
        $('#ipv4-status').html(ipv4Data && ipv4Data.ip ? '<span class="text-success">〇</span>' : '<span class="text-danger">✕</span>');
    });

    GetIPv6.then(ipv6Data => {
        IPv6 = ipv6Data.ip
        $('#ipv6-address').text(ipv6Data && ipv6Data.ip ? ipv6Data.ip : '-');
        $('#ipv6-status').html(ipv6Data && ipv6Data.ip ? '<span class="text-success">〇</span>' : '<span class="text-danger">✕</span>');
    });

    Promise.all([GetIPv4, GetIPv6]).then(results => {
        const [ipv4Data, ipv6Data] = results;
        ip = ipv4Data && ipv4Data.ip ? ipv4Data.ip : ipv6Data && ipv6Data.ip ? ipv6Data.ip : null;
        if(ip) info(ipv6Data)
        let infoText = '<span class="text-danger">取得できませんでした</span>';
        if (ipv4Data && ipv4Data.ip && ipv6Data && ipv6Data.ip) {
            infoText = '<span class="text-success">IPv4/IPv6の両方で通信しています</span>';
        } else if (ipv4Data && ipv4Data.ip) {
            infoText = '<span class="text-success">IPv4のみで通信しています</span>';
        } else if (ipv6Data && ipv6Data.ip) {
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