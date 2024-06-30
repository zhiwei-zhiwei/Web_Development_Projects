def write_html(posts_with_comments=[]):
    # TODO: get all the posts and their comments
    #       chop up the below html and loop through the posts and comments to create 
    #       the page using content from the database

    html = f"""
    <html>
       <head>
          <title>Exercise 3 - A Web Journal</title>
          <link rel="stylesheet" type="text/css" href="css/style.css">
          <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
       </head>
       <body>
          <div class="compose-button">
             <a href="post" title="create post">
             <i class="material-icons">create</i>
             </a>
          </div>
          <h1>Zhiwei's Web Journal</h1>
          <div id="posts">
        """
    for i in range(len(posts_with_comments)):
         html += """
         <post class="post" id=""" + posts_with_comments[i].get("posts_title").lower().replace(" ", "_") + """>
            <h2 class=post-title id="
            """+posts_with_comments[i].get("posts_title").lower().replace(" ", "_")+"""
            ">
"""
         html+=posts_with_comments[i].get("posts_title")
         html+="""
               <a href="#"""+posts_with_comments[i].get("posts_title").lower().replace(" ", "_")+"""">
               <i class="material-icons">link</i>
               </a>
            </h2>
            <div class="post-body">
"""
         html+=posts_with_comments[i].get("posts_body")
         html+="""
            </div>
            <h3>""" + str(len(posts_with_comments[i].get("comments")))+ """ Comments</h3>
            <div class="comment-block">
"""
         for c in range(len(posts_with_comments[i].get("comments"))):
             html += """
               <comment>
                  <div class="comment-body">
             """
             html+=posts_with_comments[i].get("comments")[c].get("comments_body")
             html+="""
                  </div>
                  <div class="comment-author">
             """
             html+=posts_with_comments[i].get("comments")[c].get("comments_author")
             html+="""
                  </div>
               </comment>
            """
         html+="""
           <a href="comment?post_id="""+ str(posts_with_comments[i].get("posts_id")) +"""">
           <i class="material-icons">create</i>
           Leave a comment
           </a>
        </div>
     </post>
     """

    html+= """
             </div>
          <!-- end of posts block -->
       </body>
    </html>
"""
    return html