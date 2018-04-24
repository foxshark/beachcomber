var dialog;

$("#listing-table").tabulator({
    //height:205, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
    layout:"fitColumns", //fit columns to width of table (optional)
    columns:[ //Define Table Columns
        {title:"Title", field:"title", formatter:"link", formatterParams:{urlField:"url"}},
        {title:"Feed", field:"feedId", align:"left", width:90},
        {title:"Url", field:"url", align:"left", visible:false},
        {title:"Price", field:"price", align:"left", width:150},
        {title:"Avail.", field:"available", formatter:"tickCross", width:100},
        {title:"Act", field:"action", align:"center", width:90, cellClick:function(e, cell){
            //clicked cell
            //alert("A: " + cell.getRow().getData().title);
            dialog.dialog( "open" );
        }}

    ],
});

dialog = $( "#dialog-form" ).dialog({
      autoOpen: false,
      height: 400,
      width: 350,
      modal: true,
      buttons: {
        "Create an account": addUser,
        Cancel: function() {
          dialog.dialog( "close" );
        }
      },
      close: function() {
        form[ 0 ].reset();
        allFields.removeClass( "ui-state-error" );
      }
    });

function addUser() {
    
}

function populateGrid(){
    $.get("/grid", function(data) {
        var items = [];
        $.each(data, function(i, itemData){
            console.log(itemData);
            var item = {
                //title:'<a href="'+itemData.guid+'">'+itemData.title+'</a>',
                title:itemData.title,
                feedId:itemData.feed_id,
                url:itemData.guid,
                //price: accounting.formatMoney(itemData.price)
                price: itemData.price,
                action: "teach"
            };

            if(itemData.soldtime > 0) {
                item.available = false;
            } else {
                item.available = true;
            }
            items.push(item);
        });

        $("#listing-table").tabulator("setData", items);
    });
}

$(document).ready(function(){
    populateGrid();
});