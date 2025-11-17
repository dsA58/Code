import os

from cs50 import SQL
from datetime import datetime
from flask import Flask, flash, redirect, render_template, request, session
from flask_session import Session
from werkzeug.security import check_password_hash, generate_password_hash

from helpers import apology, login_required, lookup, usd

# Configure application
app = Flask(__name__)

# Custom filter
app.jinja_env.filters["usd"] = usd

# Configure session to use filesystem (instead of signed cookies)
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

# Configure CS50 Library to use SQLite database
db = SQL("sqlite:///finance.db")


@app.after_request
def after_request(response):
    """Ensure responses aren't cached"""
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Expires"] = 0
    response.headers["Pragma"] = "no-cache"
    return response


@app.route("/")
@login_required
def index():
    """Show portfolio of stocks"""
    rows = db.execute(
        "SELECT * FROM user_stock WHERE id = ?", session["user_id"]
    )
    cash = db.execute(
        "SELECT cash FROM users WHERE id = ?", session["user_id"]
    )
    i = 0
    total_prices = []
    quote_prices = []
    everthing = float(cash[0]["cash"])
    for row in rows:

        quote = (lookup(row["symbol"]))
        quote_prices.append(quote["price"])
        total_prices.append(int(quote_prices[i]) * row["number"])
        everthing += total_prices[i]
        i += 1

    return render_template("index.html", quotes=rows, cash=usd(cash[0]["cash"]), quote_prices=quote_prices, total_prices=total_prices, everthing=usd(everthing))


@app.route("/buy", methods=["GET", "POST"])
@login_required
def buy():
    """Buy shares of stock"""
    if request.method == "GET":
        return render_template("buy_ask.html")
    else:
        quote_info = lookup(request.form.get("symbol"))

        if quote_info is None:
            return apology("No stock quote with this name exists")

        # Get shares input
        shares = request.form.get("shares")

        # Validate shares
        try:
            quote_number = int(shares)
            if quote_number <= 0:
                return apology("Not a valid amount of shares")
        except ValueError:
            return apology("Not a valid number of shares")

        # Check user's cash
        cash = db.execute(
            "SELECT cash FROM users WHERE id = ?", session["user_id"]
        )
        if quote_info["price"] * quote_number > cash[0]["cash"]:
            return apology("Not enough money in your account", 404)
        else:

            new_cash = cash[0]["cash"] - (quote_info["price"] * quote_number)
            now_all = datetime.now()
            now_date = now_all.strftime("%d.%m.%Y %H:%M:%S")

            db.execute("UPDATE users SET cash = ? WHERE id = ?", new_cash, session["user_id"])

            rows = db.execute("SELECT * FROM user_stock WHERE id = ?", session["user_id"])
            if len(rows) == 0:
                db.execute("INSERT INTO user_stock (number, symbol, id) VALUES (?, ?, ?)",
                           quote_number, request.form.get("symbol"), session["user_id"])
            else:
                db.execute("UPDATE user_stock SET number = number + ? ,symbol = ? WHERE id = ? ",
                           quote_number, request.form.get("symbol"), session["user_id"])
            # new history table
            add_history(quote_info["price"], quote_number, "buy",
                        session["user_id"], now_date, quote_info["symbol"])

            return redirect("/")


@app.route("/history")
@login_required
def history():
    """Show history of transactions"""
    transactions = db.execute("SELECT * FROM history WHERE id = ?", session["user_id"])

    return render_template("history.html", transactions=transactions)


@app.route("/login", methods=["GET", "POST"])
def login():
    """Log user in"""

    # Forget any user_id
    session.clear()

    # User reached route via POST (as by submitting a form via POST)
    if request.method == "POST":
        # Ensure username was submitted
        if not request.form.get("username"):
            return apology("must provide username")

        # Ensure password was submitted
        elif not request.form.get("password"):
            return apology("must provide password")

        # Query database for username

        rows = db.execute(
            "SELECT * FROM users WHERE username = ?", request.form.get("username")
        )

        # Ensure username exists and password is correct

        if len(rows) != 1 or not check_password_hash(
            rows[0]["hash"], request.form.get("password")
        ):
            return apology("invalid username and/or password", 403)

        # Remember which user has logged in
        session["user_id"] = rows[0]["id"]

        # Redirect user to home page
        return redirect("/")

    # User reached route via GET (as by clicking a link or via redirect)
    else:
        return render_template("login.html")


@app.route("/logout")
def logout():
    """Log user out"""
    # Forget any user_id
    session.clear()

    # Redirect user to login form
    return redirect("/")


@app.route("/quote", methods=["GET", "POST"])
@login_required
def quote():
    """Get stock quote."""
    if request.method == "GET":
        return render_template("quote_ask.html")
    else:
        quote_info = lookup(request.form.get("symbol"))
        if quote_info is None:
            return apology("no stock quote with this name exists")
        quote_info["price"] = usd(quote_info["price"])

        return render_template("quote_display.html", quote=quote_info)


@app.route("/register", methods=["GET", "POST"])
def register():
    """Register user"""
    if request.method == "POST":

        username_register = request.form.get("username")
        passwort_register = generate_password_hash(request.form.get("password"))

        rows = db.execute(
            "SELECT username FROM users WHERE username = ?", username_register
        )
        # Ensure username was submitted
        if not username_register:
            return apology("must provide username")


        # Ensure password was submitted
        if not request.form.get("password"):
            return apology("must provide password")

        if not request.form.get("confirmation"):
            return apology("must provide confirmation")
        if not request.form.get("confirmation") == request.form.get("password"):
            return apology("confirmation not = to password")

        if len(rows) != 0:
            return apology("Username allready taken")

        db.execute("INSERT INTO users (username, hash) VALUES (?, ?)",
                   username_register, passwort_register)
        return render_template("register.html")

    else:
        return render_template("register.html")


@app.route("/sell", methods=["GET", "POST"])
@login_required
def sell():
    """Sell shares of stock"""
    if request.method == "GET":
        options_table = db.execute("SELECT symbol FROM user_stock WHERE id = ?", session["user_id"])

        return render_template("sell.html", options=options_table)
    else:
        if not request.form.get("symbol"):
            return apology("Select pleas a symbol")
        if not request.form.get("shares"):
            return apology("Select pleas a number")

        quote_info = lookup(request.form.get("symbol"))
        if quote_info is None:
            return apology("no stock quote with this name exists")

        buy_quote_number = int(request.form.get("shares"))
        buy_quote_name = request.form.get("symbol")

        have_number = db.execute(
            "SELECT number FROM user_stock WHERE id = ? AND symbol = ?", session["user_id"], buy_quote_name
        )

        if len(have_number) != 1:
            return apology("You dont own any of this share")

        if buy_quote_number < 0 or buy_quote_number > have_number[0]["number"]:
            return apology("not an valid amount of shares")

        cash = db.execute(
            "SELECT cash FROM users WHERE id = ?", session["user_id"]
        )

        if len(cash) != 1:
            return apology("Something went wrong", 602)

        new_cash = cash[0]["cash"] + (quote_info["price"] * buy_quote_number)

        now_all = datetime.now()

        now_date = now_all.strftime("%d.%m.%Y %H:%M:%S")

        db.execute("UPDATE users SET cash = ? WHERE id = ?", new_cash, session["user_id"])

        rows = db.execute("SELECT * FROM user_stock WHERE id = ?", session["user_id"])
        if len(rows) == 0:
            return apology("Something went wrong", 601)

        quote_number = int(have_number[0]["number"]) - int(buy_quote_number)
        db.execute("UPDATE user_stock SET number = ? ,symbol = ? WHERE id = ? ",
                   quote_number, request.form.get("symbol"), session["user_id"])

        if quote_number == 0:
            db.execute("DELETE FROM user_stock WHERE id = ? AND number = ?", session["user_id"], 0)

        add_history(quote_info["price"], buy_quote_number, "sell",
                    session["user_id"], now_date, quote_info["symbol"])

        return redirect("/")


def add_history(price, quote_number, action, id_user, date, symbole):
    db.execute("INSERT INTO history (price, number, action, id, date, symbole) VALUES (?, ?, ?, ? ,?, ?)",
               usd(price), quote_number, action, id_user, date, symbole)
