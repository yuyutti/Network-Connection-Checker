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
        const response = await fetch('/api/get/ocn', {
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
        if (!data.ip) {
            connect_status.ocnIPv6 = false
            connect_status.ocn = false
        }
        else {
            $('#connect-status-ipv6').html(data.ip);
            connect_status.ocnIPv6 = true
            connect_status.ocn = true
        }
    }
    else connect_status.ocn = false
}