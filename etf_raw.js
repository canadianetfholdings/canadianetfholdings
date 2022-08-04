fetch("holdings.json").then(response => {
   return response.json()
}).then(data_holdings => {
    const holding_dict = {}
    for (let d of data_holdings) {
            holding_dict[d['Holding']] = d['Ticker']
    }

    fetch("etf.json").then(response => {
        return response.json()
    }).then(data => {
          const etf_raw = {}
          for (let d of data) {
              if (etf_raw[d['Ticker']] !== undefined) {
                 etf_raw[d['Ticker']]['holdings'].push({
                     "name": d['Holding'],
                     "ticker": holding_dict[d['Holding']] ? holding_dict[d['Holding']] : '',
                     "weight": Math.abs(d['Weight'])
                 })
              } else {
                 etf_raw[d['Ticker']] = {
                    "link": d['Link'],
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
   const holding_list = {}
    for (let key of Object.keys(etf_raw)) {
        for (let holding of etf_raw[key]['holdings']) {
            holding_list[holding['name']] ? holding_list[holding['name']] += 1 : holding_list[holding['name']] = 1
        }
    }
    const sorted_holdings = Object.keys(holding_list).map(key => { return [key, holding_list[key]] })
    sorted_holdings.sort((first, second) => { return second[1] - first[1] })

   $(document).ready(function(){
    const init_arr = []
    let temp_arr = []
    let display_default = 30
    init_load()

    $(".simple-search input").keyup((e) => {
        const input = e.target.value.trim()
        const opt = $(".simple-search option:selected").val()
        simple_search(input, opt)
    })

    $(".simple-search select").change(() => {
        const input = $(".simple-search input").val().trim()
        const opt = $(".simple-search option:selected").val()
        simple_search(input, opt)
    })

    $(".compare-search button").click(() => {
        $(".blocker").click()
        const a = $("#ticker-1").val().trim().toUpperCase()
        const b = $("#ticker-2").val().trim().toUpperCase()
        if (a && b && etf_raw[a] && etf_raw[b] && a !== b) {
            compare_holding(a, b)
        } else if (a !== '' && a === b){
            $("#ticker-2").val('').focus()
        } else {
            a !== '' || etf_raw[a] ? $("#ticker-2").focus() : $("#ticker-1").focus()
        }
    })

    $(".compare-search input").focus(function() {
        show_tickers($(this))
    }).keyup(function(e) {
        if (e.originalEvent.key === 'Enter') {
            $(".compare-search button").click()
        } else {
            show_tickers($(this))
        }
    })

    $(".blocker").click(function() {
        $(".auto-complete").css('display', 'none')
        $(this).css('display', 'none')
    })

    function init_load() {
        if (init_arr.length === 0) {
            for (let holding of sorted_holdings.slice(0, 10)) {
                const ticker = holding_dict[holding[0]] ? holding_dict[holding[0]] : ''
                const record = ['', '', ticker, holding[0], holding[1]]
                init_arr.push(record)
            }
        }
        display_row(init_arr)
    }

    function display_row(arr, limit=display_default, sorted_weight='') {
        temp_arr = [...arr]
        let html = '<div class="row-limit"><select id="row-limit" name="row-limit">'
        for (let option of [30, 50, 100]) {
             html += `<option value="${option}" ${option === limit ? 'selected': ''}>${option} Records</option>`
        }
        html += `</select></div><table><thead><tr><td>ETF Ticker</td><td>ETF</td><td>Ticker</td><td>Holding</td>
                <td class="weight-header ${sorted_weight}">Weight</td></tr>
                </thead><tbody class="table-content">`
        if (arr.length) {
            arr = arr.slice(0, limit)
            for (let ele of arr) {
                html += '<tr>'
                for (let i = 0; i < ele.length; i++) {
                    i === 0 && ele[i] ? html += `<td class="ticker-add"><a>${ele[i]}</a></td>` : html += `<td>${ele[i]}</td>`
                }
                html += '</tr>'
            }
        } else {
            html += '<tr><td colspan="5" class="center">No Results</td></tr>'
        }
        html += '</tbody></table>'
        $(".display-area").empty().append(html)
        scroll_to_top()
        $("#row-limit").change(function() {
            const row = parseInt($("#row-limit option:selected").val())
            display_default = row
            display_row(temp_arr, row)
        })
        $(".weight-header").click(function() {
            if ($(this).hasClass('sorted')) {
                display_row(sort_by_weight(temp_arr, true), display_default, 'reverse-sorted')
            } else {
                display_row(sort_by_weight(temp_arr), display_default, 'sorted')
            }
        })
        $(".ticker-add a").click(function() {
            const ticker = $(this).text()
            const inputs = [$("#ticker-1").val().toUpperCase(), $("#ticker-2").val().toUpperCase()]
            if (!inputs.includes(ticker)) {
                if (inputs[0] === '' && inputs[1] === '') {
                    $("#ticker-1").val(ticker)
                } else if (inputs[0] === '') {
                    $("#ticker-1").val(ticker)
                } else if (inputs[1] === '') {
                    $("#ticker-2").val(ticker)
                } else {
                    $("#ticker-2").val(ticker)
                }
            }
            $('.ticker-add span').remove()
            $(this).parent().append('<span>Added to Compare!</span>')
            setTimeout(() => {
                $(this).parent().find('span').remove()
            }, 1200)
        })
    }

    function sort_by_weight(arr, reverse=false) {
        const return_arr = [...arr]
        return_arr.sort((first, second) => {
            return reverse ? parseWeight(first[4]) - parseWeight(second[4]) : parseWeight(second[4]) - parseWeight(first[4])
        })
        return return_arr
    }

    function parseWeight(weight) {
        return typeof weight === 'string' ? parseFloat(weight.replace('%', '')) : weight
    }

    function scroll_to_top() {
        window.scrollTo({top: 0, behavior: 'smooth'});
    }

    function search_by(input, option) {
        const arr = []
        if (option === 'ticker') {
            for (let key of Object.keys(etf_raw)) {
                if (key.includes(input.toUpperCase())) {
                    for (let holding of etf_raw[key]['holdings']) {
                        const record = [key, etf_raw[key]['title'], holding['ticker'], holding['name'],
                                        parseFloat(holding['weight'] * 100).toFixed(1) + '%']
                        arr.push(record)
                    }
                }
            }
        } else if (option === 'title') {
            for (let key of Object.keys(etf_raw)) {
                if (etf_raw[key]['title'].toLowerCase().includes(input.toLowerCase())) {
                    for (let holding of etf_raw[key]['holdings']) {
                        const record = [key, etf_raw[key]['title'], holding['ticker'], holding['name'],
                                        parseFloat(holding['weight'] * 100).toFixed(1) + '%']
                        arr.push(record)
                    }
                }
            }
        } else if (option === 'holding') {
            for (let key of Object.keys(etf_raw)) {
                for (let holding of etf_raw[key]['holdings']) {
                    if (holding['name'].toLowerCase().includes(input.toLowerCase())) {
                       const record = [key, etf_raw[key]['title'], holding['ticker'], holding['name'],
                                        parseFloat(holding['weight'] * 100).toFixed(1) + '%']
                        arr.push(record)
                        break
                    }
                }
            }
        } else if (option === 'holding-ticker') {
            for (let key of Object.keys(etf_raw)) {
                for (let holding of etf_raw[key]['holdings']) {
                    if (holding['ticker'].includes(input.toUpperCase())) {
                       const record = [key, etf_raw[key]['title'], holding['ticker'], holding['name'],
                                        parseFloat(holding['weight'] * 100).toFixed(1) + '%']
                        arr.push(record)
                        break
                    }
                }
            }
        }
        return arr
    }

    function simple_search(input, opt) {
         if (input) {
            let combine_arr = []
            if (opt !== 'general') {
                const arr = search_by(input, opt)
                combine_arr = [...arr]
            } else {
                for (let item of ['ticker', 'title', 'holding-ticker', 'holding']) {
                    const arr = search_by(input, item)
                    for (let ele of arr) {
                        if (!combine_arr.find(rec => rec[0] === ele[0] && rec[3] === ele[3])) {
                            combine_arr.push(ele)
                        }
                    }
                }
            }
            display_row(combine_arr)
        } else {
            init_load()
        }
    }
        function show_tickers($input) {
        $(".auto-complete").css('display', 'none')
        $('.blocker').css('display', 'block')
        const tickers = Object.keys(etf_raw)
        let html = ''
        const input = $input.val().toUpperCase()
        if (input !== '') {
            let is_ticker = false
            for (let ticker of tickers) {
                if (ticker.includes(input)) {
                    html += `<a>${ticker}</a>`
                    is_ticker = true
                }
            }
            if (!is_ticker) {
                html += `<a class="no-result">No Results</a>`
            }
        } else {
            for (let ticker of tickers) {
                html += `<a>${ticker}</a>`
            }
        }
        const $ele = $input.parent().find('.auto-complete')
        $ele.empty().append(html).css('display', 'block')
        $(".auto-complete a:not(.no-result)").click(function() {
            $input.val($(this).text())
            $(".auto-complete").css('display', 'none')
            $('.blocker').css('display', 'none')
        })
    }

    function compare_holding(a, b) {
        const common_arr = []
        for (let a_holding of etf_raw[a]['holdings']) {
            const a_name = a_holding['name'].toLowerCase()
            for (let b_holding of etf_raw[b]['holdings']) {
                const b_name = b_holding['name'].toLowerCase()
                if (a_name.includes(b_name) && b_name !== '') {
                    common_arr.push(b_name)
                } else if (b_name.includes(a_name) && a_name !== '') {
                    common_arr.push(a_name)
                }
            }
        }
        let table_html = ''
        let weight_total = 0
        let weight_overlap = 0
        for (let key of [a, b]) {
            table_html += `<div><div class="compare-title"><h2>${key}</h2><p>${etf_raw[key]['title']}</p></div>
                            <hr><table><thead><tr><td>Ticker</td><td>Holding</td><td>Weight</td></tr></thead><tbody>`
            const non_highlight = []
            const highlight_arr = []
            for (let item of etf_raw[key]['holdings']) {
                let is_highlight = false
                for (let common of common_arr) {
                    if (item['name'].toLowerCase().includes(common) && !highlight_arr.find(rec => rec['name'] === item['name'])) {
                        highlight_arr.push(item)
                        is_highlight = true
                        break
                    }
                }
                if (item['name'] !== '' && !is_highlight && !non_highlight.find(rec => rec['name'] === item['name'])) {
                    non_highlight.push(item)
                }
                weight_total += item['weight']
            }
            for (let record of highlight_arr) {
                weight_overlap += record['weight']
                table_html += `<tr><td class="highlight">${record['ticker']}</td><td class="highlight">${record['name']}</td>
                        <td class="highlight">${parseFloat(record['weight'] * 100).toFixed(1) + '%'}</td></tr>`
            }
            for (let record of non_highlight) {
                table_html += `<tr><td>${record['ticker']}</td><td>${record['name']}</td>
                        <td>${parseFloat(record['weight'] * 100).toFixed(1) + '%'}</td></tr>`
            }
            table_html +="</tbody></table></div>"
        }
        const rate = weight_overlap / weight_total
        const rate_html = `<div class="rate_display"><h3><circle></circle><circle></circle><span>Overlap</span>${parseFloat(rate * 100).toFixed(0) + '%'}</h3></div><div class="compare-display">`
        $(".display-area").empty().append(rate_html + table_html + '</div>')
        const overlap_area = `${(1 - rate) * 60 - 10}px`
        $("h3 circle:first-of-type").css('left', overlap_area)
        $("h3 circle:last-of-type").css('right', overlap_area)
        scroll_to_top()
    }
})
   })
})





