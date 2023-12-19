let ip
let info_flag = false

async function IPv4orIPv6_fetch(url, timeout = 3000) {
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

(async () => {
    const ipv4 = 'your ipv4 address'
    const ipv6 = 'your ipv6 address'
    const ipv4Promise = IPv4orIPv6_fetch(`http://${ipv4}:4000/api/get/ip`);
    const ipv6Promise = IPv4orIPv6_fetch(`http://[${ipv6}]:3000/api/get/ip`);

    ipv4Promise.then(ipv4Data => {
        $('#ipv4-address').text(ipv4Data && ipv4Data.IPv4 ? ipv4Data.IPv4 : '-');
        $('#ipv4-status').html(ipv4Data && ipv4Data.IPv4 ? '<span class="text-success">〇</span>' : '<span class="text-danger">×</span>');
    });

    ipv6Promise.then(ipv6Data => {
        $('#ipv6-address').text(ipv6Data && ipv6Data.IPv6 ? ipv6Data.IPv6 : '-');
        $('#ipv6-status').html(ipv6Data && ipv6Data.IPv6 ? '<span class="text-success">〇</span>' : '<span class="text-danger">×</span>');
    });

    Promise.all([ipv4Promise, ipv6Promise]).then(results => {
        const [ipv4Data, ipv6Data] = results;
        ip = ipv4Data && ipv4Data.IPv4 ? ipv4Data.IPv4 : ipv6Data && ipv6Data.IPv6 ? ipv6Data.IPv6 : null;
        if(ip) info()
        let infoText = '取得できませんでした';
        if (ipv4Data && ipv4Data.IPv4 && ipv6Data && ipv6Data.IPv6) {
            infoText = 'IPv4/IPv6の両方で通信しています';
        } else if (ipv4Data && ipv4Data.IPv4) {
            infoText = 'IPv4のみで通信しています';
        } else if (ipv6Data && ipv6Data.IPv6) {
            infoText = 'IPv6のみで通信しています';
        }
        $('#connection').text(infoText);
    });
    
    var img = new Image();
    img.onload = () => $('#v6plus-status').html('<span class="text-success">〇 V6プラスで通信しています</span>');
    img.onerror = () => $('#v6plus-status').html('<span class="text-danger">×</span> V6プラスで通信していません');
    img.src = 'https://kiriwake4.jpne.co.jp/addr.cgi?q=img';
    img.style.display = 'none';
    document.body.appendChild(img);    
})();