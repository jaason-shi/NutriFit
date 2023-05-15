/**
 * Script file for Food Catalog type pages
 */


function addItem(id) {
    // Include or exclude item logic based on url
    if (window.location.pathName === '/foodCatalogInclude') {
        $.post('/selectFoodInclude', { item: id }, function () {
            window.location.href = "/mealFilters";
        });
    } else {
        $.post('/selectFoodExclude', { item: id }, function () {
            window.location.href = "/mealFilters";
        });
    }

}

const setup = () => {
    let url = window.location.pathname
    console.log("url")
    console.log(url)
    // Search bar event listener
    $('#searchBar').on('input', function () {
        const searchQuery = $(this).val();
        $.get('/searchFood', { q: searchQuery }, function (data) {
            $('#foodResults').empty();
            data.forEach(item => {
                $('#foodResults').append(`
                    <div class="card">
                        <div class="row no-gutters">
                            <div class="col-md-8">
                                <div class="card-body">
                                    <h5 class="card-title">${item.name}</h5>
                                    <p class="card-text">${item.measure}</p>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <button onclick="addItem('${item.id}')" class="btn btn rounded-pill btn-dark mt-4">Add</button>
                            </div>
                        </div>
                    </div>
                    `);
            });
        })
    });
}


$(document).ready(setup)