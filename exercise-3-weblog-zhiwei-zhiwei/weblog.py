# weblog.py
import html

import http_headers, index_page, leave_comment, create_post

from functools import cached_property
from http.cookies import SimpleCookie
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import parse_qsl, urlparse
import sqlite3

SECRET_PASSWORD = "phil"

# This is a simple extension on Python's built-in web server library
# See https://github.com/python/cpython/blob/3.12/Lib/http/server.py#L146C7-L146C29
class WebRequestHandler(BaseHTTPRequestHandler):

    # BaseHTTPRequestHandler will call this function for any GET request
    def do_GET(self, rejected=False):
        print("GET")
        parsedUrl = urlparse(self.path)
        # This is a python dictionary containing any query parameters the user sent
        # See https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Identifying_resources_on_the_Web#query
        queryParams = dict(parse_qsl(parsedUrl.query))
        print("queryParams",queryParams)
        db_connection = sqlite3.connect("db/weblog.sqlite3")

        match parsedUrl.path:
            case "/":
                # TODO: get posts and comments from the database
                # results = db_connection.execute("SELECT ...")

                # HINT: re-shape your data in Python so each post object has a list of its comments
                # e.g.  [
                #           {
                #               post_id: 1, 
                #               comments: [{...}, {...}, ...],
                #               ...
                #           }, 
                #           {
                #               post_id: 2,
                #               ...
                #           },
                #           ...
                #       ]

                result = db_connection.execute("select posts.id as posts_id, posts.title as posts_title, posts.body as posts_body, comments.id as comments_id, comments.body as comments_body, comments.author as comments_author from posts left join comments on posts.id = comments.post_id order by posts.id desc, comments.id asc;")
                res = result.fetchall()
                print(res)
                # print(res[0][1])
                posts_with_comments= []
                res_dict = {}
                for i in res:
                    posts_id, posts_title, posts_body, comments_id, comments_body, comments_author = i
                    # convert to json - re-shape data
                    if res_dict.get("posts_id") != posts_id:
                        if res_dict:
                            posts_with_comments.append(res_dict)
                        res_dict = {"posts_id": posts_id, "posts_title": html.escape(posts_title),
                                    "posts_body": html.escape(posts_body), "comments": []}
                    if comments_id:
                        res_dict["comments"].append({"comments_body": html.escape(comments_body),
                                                     "comments_author": html.escape(comments_author)})
                if res_dict and (not posts_with_comments or posts_with_comments[-1]["posts_id"] != res_dict["posts_id"]):
                    posts_with_comments.append(res_dict)

                # print("------------", posts_with_comments[0])
                responseBody = index_page.write_html(posts_with_comments)
                # print(responseBody)
            case "/comment":
                # TODO: get the post we're commenting on and all the previous comments on it

                p_id = queryParams.get("post_id")
                print("p_id", p_id)
                # post= {}
                queries = db_connection.execute("select posts.id as posts_id, posts.title as posts_title, posts.body as posts_body, comments.id as comments_id, comments.body as comments_body, comments.author as comments_author from posts left join comments on posts.id = comments.post_id where posts.id = ? order by comments.id asc;", (p_id,))
                res = queries.fetchall()
                print("res", res)
                post = {"post_id": None, "title": None, "c": None, "comments": []}
                for i in res:
                    post_id, title, post_body, comment_id, author, comment_body = i
                    if post["post_id"] is None:
                        # This is the first row, so initialize the post details
                        post["post_id"] = post_id
                        post["title"] = html.escape(title)
                        post["post_body"] = html.escape(post_body)

                    if comment_id:
                        # Add comment to the post's comment list
                        post["comments"].append({"author": html.escape(author), "comment_body": html.escape(comment_body)})



                responseBody = leave_comment.write_html(post)
            case "/post":
                responseBody = create_post.write_html(rejected)
            case "/css/style.css":
                responseBody = ""
                with open("css/style.css") as style:
                    responseBody += style.read()
            case _:
                response = http_headers.write_404()
                self.wfile.write(response.encode("utf-8"))
                return

        response = http_headers.write_headers()
        response += http_headers.write_blank_line()
        response += responseBody

        # print(response)

        self.wfile.write(response.encode("utf-8"))

    # BaseHTTPRequestHandler will call this function for any POST request
    def do_POST(self):
        print("POST")
        parsedUrl = urlparse(self.path)
        queryParams = dict(parse_qsl(parsedUrl.query))
        content_length = int(self.headers.get("Content-Length", 0))
        postData = self.rfile.read(content_length)
        # This is a Python dictionary containing any data from Form fields the user sent
        formData = dict(parse_qsl(postData.decode("utf-8")))

        db_connection = sqlite3.connect("db/weblog.sqlite3")
        db_actions = db_connection.cursor()
        # print("formData", formData)

        match parsedUrl.path:
            # TODO: add cases for any other paths that should receive a POST request
            #       update the database as appropriate, remembering to sanitize your inputs
            #       then render the appropriate page and send it as a response
            #       HINT: you may use do_GET() above to write the response
            case "/comment":
                print("queryParams", queryParams)
                # sample fromDate: formData {'body': '123', 'name': '123', 'post_id': '1', 'submit': 'Leave Comment'}
                curr_post_id = queryParams.get("post_id")
                new_comment_body = formData.get("body")
                new_comment_name = formData.get("name")
                print("curr_post_id ", curr_post_id, " new_comment_body ", new_comment_body, " new_comment_name ",
                      new_comment_name)
                db_actions.execute("insert into comments (post_id, body, author) values (?, ?, ?)",
                                   (curr_post_id, new_comment_body, new_comment_name))
                db_connection.commit()

                print("test do post comment")
                self.do_GET(rejected=False)


            case "/post":
                # get the password that the user entered into the form data
                # if it doesn't match the secret password on our server, return the page with
                # an error message. See create_post.py.

                # sample formData:
                # formData {'title': '123', 'body': '123111', 'password': '333', 'submit': 'Create Post'}

                password = formData.get("password")
                if password != SECRET_PASSWORD:
                    print("enter wrong password")
                    self.do_GET(rejected=True)
                    return
                else:
                    # TODO: otherwise, the passowrd matches, so we need to update the database with our new post
                    create_post_title = formData.get("title")
                    create_post_body = formData.get("body")
                    comment_post_password = formData.get("password")
                    db_actions.execute("insert into posts (title, body) values (?, ?)",
                                       (create_post_title, create_post_body))
                    db_connection.commit()

                    print("test do post post")
                    self.do_GET(rejected=False)
                    # response = http_headers.write_blank_line()
                    # self.wfile.write(response.encode("utf-8"))


            case _:
                response = http_headers.write_404()
                self.wfile.write(response.encode("utf-8"))
                return


if __name__ == "__main__":
    print("Starting web server at http://localhost:8000")
    print("Press Control-C to stop")
    server = HTTPServer(("localhost", 8000), WebRequestHandler)
    server.serve_forever()