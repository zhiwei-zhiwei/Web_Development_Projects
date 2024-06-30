const bing_api_endpoint = "https://api.bing.microsoft.com/v7.0/images/search";
const bing_api_key = BING_API_KEY;

function runSearch() {

  // TODO: Clear the results pane before you run a new search
  const container = document.getElementById("resultsImageContainer");
  while (container.firstChild) {
      container.removeChild(container.firstChild);
  }

  // const preveContainer = document.getElementById("resultsImageContainer");
  // suggestionsContainer.innerHTML = "";
  // document.getElementById('resultsImageContainer').innerHTML = '';


  openResultsPane();

  // TODO: Build your query by combining the bing_api_endpoint and a query attribute
  //  named 'q' that takes the value from the search bar input field.
  const user_input = document.querySelector(".search input").value.trim();
  const query_url = `${bing_api_endpoint}?q=${encodeURIComponent(user_input)}`;


  let request = new XMLHttpRequest();

  // TODO: Construct the request object and add appropriate event listeners to
  // handle responses. See:
  // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest_API/Using_XMLHttpRequest
  //
  //   - You'll want to specify that you want json as your response type
  //   - Look for your data in event.target.response
  //   - When adding headers, also include the commented out line below. See the API docs at:
  // https://docs.microsoft.com/en-us/bing/search-apis/bing-image-search/reference/headers
  //   - When you get your responses, add elements to the DOM in #resultsImageContainer to
  //     display them to the user
  //   - HINT: You'll need to ad even listeners to them after you add them to the DOM
  //
  // request.setRequestHeader("Ocp-Apim-Subscription-Key", bing_api_key);
  
  request.open("GET", query_url);
  request.responseType = 'json';
  request.setRequestHeader("Ocp-Apim-Subscription-Key", bing_api_key);
  console.log(request);

  request.onload = function(event) {
    if (request.status >= 200 && request.status < 300) {
      // const img_source = request.response.value;
      
      // const img_source = event.target.response;
      // console.log(img_source);
      // const resImg = document.getElementById("resultsImageContainer");

      const response = event.target.response;
      console.log(response);
      const images = response.value;
      const queryExpansions = response.queryExpansions;

      // display suggestions (keywords)
      const suggestions = document.querySelector(".suggestions ul");
      suggestions.innerHTML = "";
      queryExpansions.forEach(element => {
          const li = document.createElement("li");
          li.textContent = element.displayText;
          li.onclick = () => {
              document.querySelector(".search input").value = element.displayText;
              runSearch();
          };
          suggestions.appendChild(li);
      });

      images.forEach(element => {
        console.log(element);
        const div = document.createElement("div");
        div.className = "res_image";
        const img = document.createElement("img");
        img.src = element.thumbnailUrl;
        img.alt = element.name;
        // show img on the borad
        img.onclick = () => {
          const board = document.getElementById("board");
          const div = document.createElement("div");
          div.className = "savedImage";
          const img = document.createElement("img");
          img.src = element.contentUrl;
          div.appendChild(img);
          board.appendChild(div);
        };

        div.appendChild(img);
        document.getElementById("resultsImageContainer").appendChild(div);
      });
    }else{
      console.error("Request failed with status: ", request.status);
    }
  }

  // TODO: Send the request
  request.send();

  return false;  // Keep this; it keeps the browser from sending the event
                  // further up the DOM chain. Here, we don't want to trigger
                  // the default form submission behavior.
}

function openResultsPane() {
  // This will make the results pane visible.
  document.querySelector("#resultsExpander").classList.add("open");
}

function closeResultsPane() {
  // This will make the results pane hidden again.
  document.querySelector("#resultsExpander").classList.remove("open");
}

// This will 
document.querySelector("#runSearchButton").addEventListener("click", runSearch);
document.querySelector(".search input").addEventListener("keypress", (e) => {
  if (e.key == "Enter") {runSearch()}
});

document.querySelector("#closeResultsButton").addEventListener("click", closeResultsPane);
document.querySelector("body").addEventListener("keydown", (e) => {
  if(e.key == "Escape") {closeResultsPane()}
});
