def write_html(post={}):
  # TODO: Display the post the user is commenting on, and the existing comments
  html = f"""
  <html>
     <head>
        <title>Leave a Comment</title>
        <link rel="stylesheet" type="text/css" href="css/style.css">
        <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
     </head>
     <body>
        <h1>Zhiwei's Web Journal</h1>"""

  if_one = False
  if len(post.get("comments")) == 1:
      if_one = True
  html += """
        <div class="leave-comment">
           <h2>
              Leave a Comment on
              <a href="weblog.php#a_post_title">"""
  html += post.get("title")
  html+="""</a>
           </h2>
           <div class="post-body">
"""
  html += post.get("post_body")
  html += """
</div>
<h3>"""
  html += str(len(post.get("comments")))
  html += " comment" if if_one else " comments"
  html += """</h3>
           <div class="comment-block">
           """

  for c in range(len(post.get("comments"))):
      html +="""
              <div class="comment">
                 <div class="comment-body">
                    """
      html+=post.get("comments")[c].get("comment_body")
      html+="""
                 </div>
                 <div class="comment-author">
    """
      html+=(post.get("comments")[c].get("author"))
      html+="""
                 </div>
              </div>
          """

  html += """
           </div>
           <form method="post">
              <label for="body">Comment</label>
              <textarea name="body"></textarea>
              <label for="name">Your name</label>
              <input name="name"></input>
              <input type="hidden" name="post_id" value="1"></input>
              <input type="submit" name="submit" value="Leave Comment"></input>
           </form>
        </div>
        <a href="/">Home</a>
     </body>
  </html>"""
  return html