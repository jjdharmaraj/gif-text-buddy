exports = function (query, limit, offset) {
  const GIPHY_API_KEY = context.values.get("GIPHY_API_KEY");
  const http = context.services.get("fb-hook-service");

  let url = "https://api.giphy.com/v1/gifs/search?api_key=" + GIPHY_API_KEY
    + "&q=" + query
    + "&limit=" + limit
    + "&offset=" + offset
    + "&rating=G&lang=en";
  return http.get({ url: url })
    .then(giphyObj => {
      console.log(EJSON.stringify(giphyObj));
      let body = EJSON.parse(giphyObj.body.text());
      return body.data[0].images.original.url;
    });
};