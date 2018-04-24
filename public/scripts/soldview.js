$("#listing-table").tabulator({
    //height:205, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
    layout:"fitColumns", //fit columns to width of table (optional)
    columns:[ //Define Table Columns
        {title:"Title", field:"title", formatter:"link", formatterParams:{urlField:"url"}},
        {title:"Url", field:"url", align:"left", visible:false},
        {title:"Price", field:"price", align:"left", width:150},
        {title:"Avail.", field:"available", formatter:"tickCross", width:100}
    ]
    /*,
    tooltips:function(cell){
        //cell - cell component

        //function should return a string for the tooltip of false to hide the tooltip
        return  cell.getColumn().getField() + " - " + cell.getValue(); //return cells "field - value";
    }
    /*
    rowClick:function(e, row){ //trigger an alert message when the row is clicked
        alert("Row " + row.getData().id + " Clicked!!!!");
    },
    */
});



$.get("/sold", function(data) {
        var items = [];
        $.each(data, function(i, itemData){
            console.log(itemData);
            var item = {
                //title:'<a href="'+itemData.guid+'">'+itemData.title+'</a>',
                title:itemData.title,
                url:itemData.guid,
                price: itemData.price
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