const etf_raw = {};
const sorted_holdings = [];

fetch("holdings.json").then(response => {
    return response.json();
}).then(holding_data => {
    const holding_dict = {};
    for (let d of holding_data) {
        holding_dict[d['Holding']] = d['Ticker'];
    }

    fetch("etf.json").then(response => {
        return response.json();
    }).then(data => {
        for (let d of data) {
            if (etf_raw[d['Ticker']] !== undefined) {
                etf_raw[d['Ticker']]['holdings'].push({
                    "name": d['Holding'],
                    "ticker": holding_dict[d['Holding']] ? holding_dict[d['Holding']] : '',
                    "weight": Math.abs(d['Weight'])
                })
            } else {
                etf_raw[d['Ticker']] = {
                    "title": d['Title'],
                    "holdings": [
                        {
                            "name": d['Holding'],
                            "ticker": holding_dict[d['Holding']] ? holding_dict[d['Holding']] : '',
                            "weight": Math.abs(d['Weight'])
                        }
                    ]
                }
            }
        }
        // process holding list with weight count
        const holding_list = {};
        for (let key of Object.keys(etf_raw)) {
            for (let holding of etf_raw[key]['holdings']) {
                holding_list[holding['name']] ? holding_list[holding['name']] += 1 : holding_list[holding['name']] = 1
            }
        }
        const sorted = Object.keys(holding_list).map(key => {
            return [key, holding_list[key]];
        })
        sorted.sort((first, second) => {
            return second[1] - first[1];
        })
        const sliced = sorted.slice(0,10);
        for (let d of sliced) {
            d.push(holding_dict[d[0]] ? holding_dict[d[0]] : "");
            sorted_holdings.push(d);
        }
    })
})