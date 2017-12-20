$(document).ready(function(){
    var mainData = '';
    var totalPages = 0;
    var dataArr = '';
    var pageNo = 0;
    var searchQuery = '';

    function getContent(options){
        var defer = $.Deferred()
        $.ajax(options)
        .done(function( res ){
            defer.resolve(res)
        })
        .error(function( err ){
            defer.reject(err)
        })
        return defer.promise();
    }

    $(document).on('click', '#searchQuery', function( evt ){
        $("section").find(".error").addClass("hide")
        var inputVal = document.querySelector(".search-input").value
        if(!inputVal){
            $("section").find(".error").removeClass("hide")
            return;
        }
        searchQuery = inputVal;
        showContent(inputVal)
    })

    $(document).on('click', '.action-col', function(evt){
        if ( $(evt.currentTarget).hasClass('first') ) {
            getFirstPage()
        }else if ( $(evt.currentTarget).hasClass('last') ) {
            getLastPage()
        }else if ( $(evt.currentTarget).hasClass('next') ) {
            getNextPage()
        }else{
            getPrevPage()
        }
    })

    function showContent(query){
        getContent({url : 'https://hn.algolia.com/api/v1/search?query='+query+'&page='+pageNo, method: 'GET'})
        .then( function( res ){
            $('.no-data').addClass('hide')
            if( !res || !res.hits.length ) {
                showNoData()
            }else {
                constructData( res )
            }
        }, function( err ){
            console.log("Error: ", err)
        })
    }

    function showNoData (){
        $('.show-data').html('')
        $('.no-data').removeClass('hide')
        showQueryActions()
        return;
    }

    function constructData( data ) {
            mainData = data;
            renderData( )
    }

    function getFirstPage() {
        pageNo = 0;
        showContent( searchQuery )
    }

    function getLastPage() {
        pageNo = totalPages;
        showContent( searchQuery )
    }

    function getPrevPage() {
        if ( pageNo == 0 ) {
            return;
        }
        pageNo--;
        showContent( searchQuery )
    }

    function getNextPage() {
        if ( pageNo == totalPages ) {
            return;
        }
        pageNo++;
        showContent( searchQuery )
    }

    function showQueryActions(){
        if ( pageNo == totalPages ) {
            $('.last, .next').addClass('disabled')
        }else{
            $('.last, .next').removeClass('disabled')
        }
        if ( pageNo == 0 ) {
            $('.first, .prev').addClass('disabled')
        }else {
            $('.first, .prev').removeClass('disabled')
        }
    }

    function renderData(){
        totalPages = mainData.nbPages;
        dataArr = mainData.hits;
        $('.show-data').removeClass('hide')
        $('.show-data').html('loading...').removeClass('table-bordered')
        $('.file-actions').addClass('hide')
        var promiseArr = [];
        var submissionCount = {};
        var index = 0;
        dataArr.forEach( function(ele){
            var localData = JSON.parse(localStorage.getItem('myData_'+pageNo))
            if(localData && typeof localData[ele.author] !== 'undefined'){
                submissionCount[index] = localData[ele.author];
            }else{
                promiseArr.push(getContent({url : 'https://hn.algolia.com/api/v1/users/'+ele.author, method: 'GET'}))
            }
            index++;
        })
        $.when.apply($, promiseArr)
        .then( function(){
            var responseArr = Array.prototype.slice.call(arguments);
            appendHTML(dataArr, responseArr, submissionCount)
        })
    }

    function appendHTML( dataArr, countArr, localData ){
        var html = '<tbody><th>Title</th><th>Author(Submission Count)</th>';
        var myDataObj = {};
        for (var i = 0; i < dataArr.length; i++) {
            var count = 0;
            if( localData && typeof localData[i] !== 'undefined'){
                count = localData[i]
            }else{
                count = countArr[i].submission_count;
                myDataObj[dataArr[i].author] = count;
            }
            var tr = '<tr>'
            var title = dataArr[i].title || dataArr[i].story_title;
            var url = dataArr[i].url || dataArr[i].story_url;
            var author = dataArr[i].author;
            tr += '<td class="list-item"><a href="'+url+'">'+title+'</a></td><td><span class="author">'+author+'('+count+')</span></td></tr>';
            html += tr;
        }
        if( !localStorage.getItem('myData_'+pageNo) ) localStorage.setItem('myData_'+pageNo, JSON.stringify(myDataObj))
        $('.show-data').html(html+'</tbody>').addClass('table-bordered');
        $('.file-actions').removeClass('hide')
        showQueryActions();
    }

})
