$(document).ready(function() {
    $('#search-form').on('submit', handleFormSubmit);
  });
  
  function handleFormSubmit(e) {
    e.preventDefault(); // prevent form submission
    const searchQuery = $('#search-bar').val();
    $.get('/searchFood', { q: searchQuery })
      .done(displaySearchResults)
      .fail(handleError);
  }
  
  function displaySearchResults(data) {
    const foodResults = $('#foodResults');
    foodResults.empty();
    data.forEach(item => {
      const html = `
        <div>
          <p>${item.name} - ${item.measure}</p>
          <button onclick="addItem('${item.id}')">Add</button>
        </div>
      `;
      foodResults.append(html);
    });
  }
  
  function addItem(id) {
    $.post('/selectFood', { item: id })
      .done(handleAddItemSuccess)
      .fail(handleError);
  }
  
  function handleAddItemSuccess() {
    window.location.href = '/selectedFood';
  }
  
  function handleError(error) {
    console.error(error);
    alert('An error occurred. Please try again later.');
  }