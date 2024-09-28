function submitForm() {
    event.preventDefault();
    addQuery('search', document.getElementById('search').value, "true");
}

function addQuery(e, r, search = 'false') {
    var url = window.location.href;
    var url_parts = url.split("?");
    var url_without_query = url_parts[0];
    var query_string = url_parts[1] || ''; // If there is no query string, use an empty string

    url_array = query_string.split("&");
    url_array.push(e + '=' + r);

    var l = [], t = [], n = [], src = [];
    utm_source = [];
    utm_medium = [];
    utm_term = [];
    utm_content = [];
    utm_campaign = [];
    for (i = 0; i < url_array.length; i++)

        url_array[i].includes("search") ? src.push(url_array[i].replace("search=", "")) :
            url_array[i].includes("fields") ? l.push(url_array[i].replace("fields=", "")) :
                url_array[i].includes("degree") ? t.push(url_array[i].replace("degree=", "")) :
                    url_array[i].includes("location") ? n.push(url_array[i].replace("location=", "")) :
                        url_array[i].includes("utm_source") ? utm_source.push(url_array[i].replace("utm_source=", "")) :
                            url_array[i].includes("utm_medium") ? utm_medium.push(url_array[i].replace("utm_medium=", "")) :
                                url_array[i].includes("utm_term") ? utm_term.push(url_array[i].replace("utm_term=", "")) :
                                    url_array[i].includes("utm_content") ? utm_content.push(url_array[i].replace("utm_content=", "")) :
                                        url_array[i].includes("utm_campaign") && utm_campaign.push(url_array[i].replace("utm_campaign=", ""));

    var srch = '';
    var c, o, u, utm;

    c = create_url_query(l, r, "fields"),
        o = create_url_query(t, r, "degree"),
        u = create_url_query(n, r, "location"),
        utm = create_url_query(utm_source, r, "utm_source") + create_url_query(utm_medium, r, "utm_medium") + create_url_query(utm_term, r, "utm_term") + create_url_query(utm_content, r, "utm_content") + create_url_query(utm_campaign, r, "utm_campaign");

    if (Array.isArray(src) && src.length > 1) {
        srch = create_url_query(src[1], r, "search");
    } else {
        srch = create_url_query(src, r, "search");
    }

    var s = '';
    srch_array = [];
    if (srch != '') {
        s += srch.replace(/%20/g, '+').replace(/&/g, '%26');
    } else {
        if (document.getElementById('search').value != '') {
            s += '&search=' + document.getElementById('search').value;
        } else {
            s += document.getElementById('search').value;
        }
    }
    if (search == 'false') {
        if (c != '') {
            s += c;
        }
        if (o != '') {
            s += o;
        }
        if (u != '') {
            s += u;
        }
    }
    if (utm != '') {
        s += utm;
    }

    s = url_without_query + '?' + s;
    window.location = s.replace(",,", ",").replace("=,", "=").replace(",&", "&").replace("#", "").replace("?&", "?").replace("?%26", "?");
}

function countItems(e, r) {
	for (var a = 0, l = 0; l < e.length; l++) e[l] === r && a++;
	return a;
}
function create_url_query(e, r, a) {
    var l = "";
    if (e.length > 0) {
        var i = e.toString().split(",");
        if (countItems(i, r) > 1) {
            if (0 === i.indexOf(r)) {
                const i = new RegExp(`\\b${r}\\b`, "g");
                l = "&" + a + "=" + e.toString().replace(i, "");
            } else {
                const i = new RegExp(`,\\b${r}\\b`, "g");
                l = "&" + a + "=" + e.toString().replace(i, "");
            }
        } else l = "&" + a + "=" + e;
    }
    return l;
}
function addQueryNews(e, r) {
	var a;
	(a = window.location.href.includes("?") ? window.location.href + "&" + e + "=" + r : window.location.href + "?search_phrase=&" + e + "=" + r), (a = decodeURIComponent(a)), (url_array = a.split("&"));
	var l = [],
		t = [],
		n = [];
	for (i = 0; i < url_array.length; i++)
		url_array[i].includes("site")
			? l.push(url_array[i].replace("site=", ""))
		: url_array[i].includes("category")
			? t.push(url_array[i].replace("category=", ""))
		: url_array[i].includes("location") && n.push(url_array[i].replace("location=", ""));
	var c, o;
	(c = create_url_query(l, r, "site")), (o = create_url_query(t, r, "category")), create_url_query(n, r, "location");
	var u = url_array[0] + c + o;
	window.location = u.replace(",,", ",").replace("=,", "=").replace(",&", "&");
}
window.location.href.includes("?") && "" !== window.location.href.split("=")[1] && document.getElementById("results-chips").querySelector("a").setAttribute("style", "display:inline-block");
for (var chips = document.getElementsByClassName("checkbox checked"), i = 0; i < chips.length; i++)
	$('<span href="" class="chip"><span class="chip__label">' + chips[i].parentElement.textContent + "</span></span>").insertBefore(".aggregate__reset");
