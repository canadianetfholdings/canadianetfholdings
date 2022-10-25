$(document).ready(function(){
    let temp_arr = []
    let compare_index = 1;
    load_home();

    //display info
    $("header .btn-round").click(function() {
        $("info").toggleClass("info-active");
        $(this).toggleClass("btn-round-active");
        $('.blocker').css('display', 'block');
    });
    //control dropdown menu
    $(".dropdown").click(function() {
        $(".options").removeClass("drop-down-option-active")
        $(this).parent().find(".options").addClass("drop-down-option-active");
        $('.blocker').css('display', 'block');
    });
    $("simple-search .options > p").click(function(){
        $(this).parent().parent().find(".dropdown > p").text($(this).text());
        $(".options").removeClass("drop-down-option-active");
        $('.blocker').click();
    });
    $(".search-results .options > p").click(function() {
        $(this).parent().parent().find(".dropdown > p").text($(this).text());
        $(".options").removeClass("drop-down-option-active");
        $('.blocker').click();
        display_search_results(temp_arr);
    });
    //sort
    $(".sort").click(function() {
        if ($(this).hasClass("sort-ascending")) {
            $(this).removeClass("sort-ascending").addClass("sort-descending");
            display_search_results(sort_by_weight(temp_arr, true));
        } else {
            $(this).removeClass("sort-descending").addClass("sort-ascending");
            display_search_results(sort_by_weight(temp_arr));
        }
    });
    $(".blocker").click(function() {
        $("auto-complete").css('display', 'none');
        $(".options").removeClass("drop-down-option-active");
        $(this).css('display', 'none');
        $("info").removeClass("info-active");
    });
    $("simple-search input").keyup((e) => {
        const input = e.target.value.trim();
        const opt = $("simple-search .dropdown > p").text();
        simple_search(input, opt);
    });
    $("simple-search .btn-round").click(function() {
        $("simple-search input").val("");
        const opt = $("simple-search .dropdown > p").text();
        simple_search("", opt);
        $(".scroll-to-top").css("display", "none");
    })

    $("compare-search > button").click(() => {
        $(".blocker").click();
        const a = $("#ticker-1").val().trim().toUpperCase();
        const b = $("#ticker-2").val().trim().toUpperCase();
        if (a && b && etf_raw[a] && etf_raw[b] && a !== b) {
            compare_holding(a, b);
        } else if (a !== '' && a === b){
            $("#ticker-2").val('').focus();
        } else {
            a !== '' || etf_raw[a] ? $("#ticker-2").focus() : $("#ticker-1").focus()
        }
    })

    $("compare-search input").focus(function() {
        show_tickers($(this));
    }).keyup(function(e) {
        if (e.originalEvent.key === 'Enter') {
            $("compare-search button").click();
        } else {
            show_tickers($(this))
        }
    });

    //scroll to top button
    $(window).scroll(function() {
        if ($("body").height() > $(window).height()) {
            $(".scroll-to-top").css("display", "block").click(function() {
                scroll_to_top();
            })
        } else {
            $(".scroll-to-top").css("display", "none");
        }
    });


    function main_chip_click() {
        $("main-chip").click(function() {
            $("simple-search input").val($(this).text());
            const opt = $("simple-search .dropdown > p").text();
            simple_search($(this).text(), opt);
        });
    }

    function load_home() {
        let pop_search_html = "";
        let top_holdings_html = "";
        setTimeout(() => {
            for (let holding of sorted_holdings) {
                pop_search_html += `<main-chip>${holding[0]}</main-chip>`
                top_holdings_html+= `<tr><td>${holding[2]}</td><td>${holding[0]}</td><td>${holding[1]}</td></tr>`;
            }
            $("popular-searches").empty().append(pop_search_html);
            $(".top-holdings tbody").empty().append(top_holdings_html);
            $("main > div").css("display", "none");
            $(".home").css("display", "flex");
            main_chip_click();
        }, 400);
    }

    function parseWeight(weight) {
        return typeof weight === 'string' ? parseFloat(weight.replace('%', '')) : weight;
    }

    function sort_by_weight(arr, reverse=false) {
        const return_arr = [...arr];
        return_arr.sort((first, second) => {
            return reverse ? parseWeight(first[4]) - parseWeight(second[4]) : parseWeight(second[4]) - parseWeight(first[4]);
        })
        return return_arr;
    }

    function scroll_to_top() {
        window.scrollTo({top: 0, behavior: 'smooth'});
    }

    function show_tickers($input) {
        $("auto-complete").css('display', 'none');
        $('.blocker').css('display', 'block');
        const tickers = Object.keys(etf_raw);
        let html = '';
        const input = $input.val().toUpperCase();
        if (input !== '') {
            let is_ticker = false;
            for (let ticker of tickers) {
                if (ticker.includes(input)) {
                    html += `<p>${ticker}</p>`;
                    is_ticker = true;
                }
            }
            if (!is_ticker) {
                html += `<p class="no-result">No Results</p>`;
            }
        } else {
            for (let ticker of tickers) {
                html += `<p>${ticker}</p>`;
            }
        }
        const $ele = $input.parent().find('auto-complete');
        $ele.empty().append(html).css('display', 'block');
        console.log($ele.height());
        if ($ele.height() > 150) {
            $ele.addClass("allow-scroll");
        } else {
            $ele.removeClass("allow-scroll");
        }
        $("auto-complete p:not(.no-result)").click(function() {
            $input.val($(this).text());
            $("auto-complete").css('display', 'none');
            $('.blocker').css('display', 'none');
        })
    }

    function simple_search(input, opt) {
        if (input) {
            $("simple-search .btn-round").css("display","flex");
            $(".sort").removeClass("sort-ascending sort-descending");
            if (input.includes(";")) {
                let result_arr = [];
                const input_arr = input.split(";");
                for (let input_item of input_arr) {
                    if (input_item.trim()) {
                        const single_result = single_search(input_item, opt);
                        for (let ele of single_result) {
                            const find_index = result_arr.findLastIndex(rec => rec[0] === ele[0]);
                            if (find_index === -1) {
                                result_arr.push(ele);
                            } else {
                                if (result_arr[find_index][3] !== ele[3]) {
                                    result_arr.splice(find_index + 1, 0, ele);
                                }
                            }
                        }
                    }
                }
                display_search_results(result_arr);
            } else {
                display_search_results(single_search(input, opt));
            }
        } else {
            $("simple-search .btn-round").css("display","none");
            $("main > div").css("display", "none");
            $(".home").css("display", "flex");
        }
    }

    function single_search(input, opt) {
        input = input.trim();
        let combine_arr = [];
        if (opt !== 'All Categories') {
            const arr = search_by(input, opt);
            combine_arr = [...arr];
        } else {
            for (let item of ['ETF Ticker', 'ETF Name', 'Holding Ticker', 'Holding Name']) {
                const arr = search_by(input, item);
                for (let ele of arr) {
                    if (!combine_arr.find(rec => rec[0] === ele[0] && rec[3] === ele[3])) {
                        combine_arr.push(ele);
                    }
                }
            }
        }
        return combine_arr;
    }

    function search_by(input, option) {
        const arr = [];
        if (option === 'ETF Ticker') {
            for (let key of Object.keys(etf_raw)) {
                if (key.includes(input.toUpperCase())) {
                    for (let holding of etf_raw[key]['holdings']) {
                        const record = [key, etf_raw[key]['title'], holding['ticker'], holding['name'],
                            parseFloat(holding['weight'] * 100).toFixed(1) + '%'];
                        arr.push(record);
                    }
                }
            }
        } else if (option === 'ETF Name') {
            for (let key of Object.keys(etf_raw)) {
                if (etf_raw[key]['title'].toLowerCase().includes(input.toLowerCase())) {
                    for (let holding of etf_raw[key]['holdings']) {
                        const record = [key, etf_raw[key]['title'], holding['ticker'], holding['name'],
                            parseFloat(holding['weight'] * 100).toFixed(1) + '%'];
                        arr.push(record);
                    }
                }
            }
        } else if (option === 'Holding Name') {
            for (let key of Object.keys(etf_raw)) {
                for (let holding of etf_raw[key]['holdings']) {
                    if (holding['name'].toLowerCase().includes(input.toLowerCase())) {
                        const record = [key, etf_raw[key]['title'], holding['ticker'], holding['name'],
                            parseFloat(holding['weight'] * 100).toFixed(1) + '%'];
                        arr.push(record);
                        break;
                    }
                }
            }
        } else if (option === 'Holding Ticker') {
            for (let key of Object.keys(etf_raw)) {
                for (let holding of etf_raw[key]['holdings']) {
                    if (holding['ticker'].includes(input.toUpperCase())) {
                        const record = [key, etf_raw[key]['title'], holding['ticker'], holding['name'],
                            parseFloat(holding['weight'] * 100).toFixed(1) + '%'];
                        arr.push(record);
                        break;
                    }
                }
            }
        }
        return arr;
    }

    function compare_holding(a, b) {
        const common_arr = []
        for (let a_holding of etf_raw[a]['holdings']) {
            const a_name = a_holding['name'].toLowerCase();
            for (let b_holding of etf_raw[b]['holdings']) {
                const b_name = b_holding['name'].toLowerCase()
                if (a_name.includes(b_name) && b_name !== '') {
                    common_arr.push(b_name);
                } else if (b_name.includes(a_name) && a_name !== '') {
                    common_arr.push(a_name);
                }
            }
        }
        let weight_total = 0;
        let weight_overlap = 0;
        let etf_index = 0;
        for (let key of [a, b]) {
            $(`overlap-etf:nth-child(${etf_index + 1}) .overlap-eft-title > h1`).text(key);
            $(`overlap-etf:nth-child(${etf_index + 1}) .overlap-eft-title > p`).text(etf_raw[key]["title"]);
            const non_highlight = [];
            const highlight_arr = [];
            for (let item of etf_raw[key]['holdings']) {
                let is_highlight = false;
                for (let common of common_arr) {
                    if (item['name'].toLowerCase().includes(common) && !highlight_arr.find(rec => rec['name'] === item['name'])) {
                        highlight_arr.push(item);
                        is_highlight = true;
                        break;
                    }
                }
                if (item['name'] !== '' && !is_highlight && !non_highlight.find(rec => rec['name'] === item['name'])) {
                    non_highlight.push(item);
                }
                weight_total += item['weight'];
            }
            $(`overlap-etf:nth-child(${etf_index + 1}) tbody`).empty();
            for (let record of highlight_arr) {
                weight_overlap += record['weight'];
                const html = `<tr><td class="highlight">${record['ticker']}</td><td class="highlight">${record['name']}</td>
                        <td class="highlight">${parseFloat(record['weight'] * 100).toFixed(1) + '%'}</td></tr>`;
                $(`overlap-etf:nth-child(${etf_index + 1}) tbody`).append(html);
            }
            for (let record of non_highlight) {
                const html = `<tr><td>${record['ticker']}</td><td>${record['name']}</td>
                        <td>${parseFloat(record['weight'] * 100).toFixed(1) + '%'}</td></tr>`;
                $(`overlap-etf:nth-child(${etf_index + 1}) tbody`).append(html);
            }
            etf_index += 1;
        }
        const rate = weight_overlap / weight_total;
        const parsed_rate = parseFloat(rate * 100).toFixed(0) + '%';
        $(".overlap-rate > h1").text(parsed_rate);
        const overlap_area = `${(1 - rate) * 65}px`;
        $(".circles circle:first-of-type").css('left', overlap_area);
        $(".circles circle:last-of-type").css('right', overlap_area);
        $("main > div").css("display", "none");
        $(".find-overlap").css("display", "block");
        scroll_to_top();
        $(".scroll-to-top").css("display", "none");
    }

    function display_search_results(arr) {
        temp_arr = [...arr];
        const record = parseInt($(".search-results .dropdown > p").text().split(" ")[1]);
        let html = "";
        if (arr.length) {
            arr = arr.slice(0, record);
            for (let ele of arr) {
                html += '<tr>'
                for (let i = 0; i < ele.length; i++) {
                    i === 0 && ele[i] ? html += `<td class="tooltip"><span>${ele[i]}</span></td>` : html += `<td>${ele[i]}</td>`
                }
                html += '</tr>'
            }
        } else {
            html += '<tr><td colspan="5" class="no-search-result">No Results</td></tr>'
        }
        $(".search-results tbody").empty().append(html);
        $(".tooltip").mouseenter(function() {
            $(this).append(`<tooltip>Add to Find Overlap</tooltip>`);
        }).mouseleave(function() {
            $(this).find("tooltip").remove();
        }).click(function() {
            const ticker = $(this).find("span").text();
            const inputs = [$("#ticker-1").val().toUpperCase(), $("#ticker-2").val().toUpperCase()];
            if (!inputs.includes(ticker)) {
                if (inputs[0] === '') {
                    $("#ticker-1").val(ticker);
                } else if (inputs[1] === '') {
                    $("#ticker-2").val(ticker);
                } else {
                    $(`#ticker-${compare_index}`).val(ticker);
                    compare_index === 1 ? compare_index = 2 : compare_index = 1;
                }
            }
        });
        $("main > div").css("display", "none");
        $(".search-results").css("display", "block");
        scroll_to_top();
        $(".scroll-to-top").css("display", "none");
    }
})