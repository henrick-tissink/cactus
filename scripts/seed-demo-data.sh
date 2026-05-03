#!/bin/bash
set -e

API="http://localhost:8080/api"

# Login
RESP=$(curl -s -X POST $API/auth/login -H "Content-Type: application/json" \
  -d '{"email":"henrick@cactus.app","password":"Cactus2026"}')
TOKEN=$(echo $RESP | python3 -c "import sys,json; print(json.load(sys.stdin)['accessToken'])")
AUTH="Authorization: Bearer $TOKEN"
CT="Content-Type: application/json"

echo "=== Creating accounts ==="

# Cheque account
ACCT1=$(curl -s -X POST $API/accounts -H "$AUTH" -H "$CT" \
  -d '{"name":"FNB Cheque","accountType":1,"balance":24350.75,"isManual":true}')
CHEQUE=$(echo $ACCT1 | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "FNB Cheque: $CHEQUE"

# Savings account
ACCT2=$(curl -s -X POST $API/accounts -H "$AUTH" -H "$CT" \
  -d '{"name":"FNB Savings","accountType":2,"balance":18500.00,"isManual":true}')
SAVINGS=$(echo $ACCT2 | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "FNB Savings: $SAVINGS"

echo "=== Setting up spending plans (6 months) ==="
curl -s -X PUT $API/spending-plans -H "$AUTH" -H "$CT" \
  -d '{"monthlyIncome":45000,"needsPercentage":50,"wantsPercentage":30,"goalsPercentage":20}' > /dev/null

echo "=== Adding debts ==="
curl -s -X POST $API/onboarding/steps -H "$AUTH" -H "$CT" \
  -d '{"stepNumber":4,"stepName":"debts","response":{"debts":[{"name":"Credit Card","debtType":1,"originalAmount":35000,"currentBalance":12500,"interestRate":21.5,"minimumPayment":750},{"name":"Personal Loan","debtType":2,"originalAmount":50000,"currentBalance":28000,"interestRate":15,"minimumPayment":1200}]}}' > /dev/null

# Category IDs
MACRO_NEEDS="62b94b6e-77b0-417a-8f85-f92b10d15bc7"
MACRO_WANTS="cf40c2fb-4eeb-4c63-8542-e8dec8298b90"
MACRO_GOALS="181f9dac-eab7-4f32-9fbc-074d1502ac5b"

CAT_HOUSING="aaa781fd-deb9-41e1-a993-9c6f4d5f1bce"
CAT_UTILITIES="ec7b5efa-d3da-43a4-914e-ec072233ebc6"
CAT_GROCERIES="079190c2-632c-4857-8420-8a96ff5884a0"
CAT_TRANSPORT="8e5f086c-50ff-49e3-be83-27c2d7618319"
CAT_INSURANCE="119bc08f-381f-4e53-b51e-e079d7209f74"
CAT_HEALTHCARE="353d8cbc-30fa-4f83-977a-c7dd08bd825f"
CAT_DEBT_MIN="0938c425-1140-470e-9e2e-f6b32c3b5057"

CAT_DINING="de065d9e-5eab-43d8-ace5-196a2005bc16"
CAT_ENTERTAINMENT="fd00bb74-0946-4d49-88bc-4f3e0eca4e90"
CAT_SHOPPING="2e92080f-92c3-417b-9f82-046bf5fbebde"
CAT_SUBSCRIPTIONS="cb1971bd-5b08-47ae-8a35-89210a2a3225"
CAT_FITNESS="212abeb3-fcef-43d0-8520-e6f21b9ab3d2"

CAT_EMERGENCY="bbdf5e33-62eb-47fe-9e15-adb90da001ff"
CAT_DEBT_PAYOFF="0093ea7a-64fb-40b6-8b8b-3b95f7f92af0"
CAT_INVEST="9325e521-b5bb-43d4-83e6-b55f9fe9bb4b"

add_tx() {
  local acct=$1 desc="$2" amt=$3 type=$4 date=$5 macro=$6 cat=$7
  curl -s -X POST $API/transactions -H "$AUTH" -H "$CT" \
    -d "{\"accountId\":\"$acct\",\"amount\":$amt,\"type\":$type,\"description\":\"$desc\",\"transactionDate\":\"${date}T10:00:00Z\",\"macroCategoryId\":\"$macro\",\"categoryId\":\"$cat\"}" > /dev/null
}

echo "=== Creating 6 months of transactions ==="

# Generate transactions for Oct 2025 - Mar 2026
for month_offset in 5 4 3 2 1 0; do
  # Calculate year/month
  base_month=$((3 - month_offset))  # March = 3
  if [ $base_month -le 0 ]; then
    YEAR=2025
    MONTH=$((base_month + 12))
  else
    YEAR=2026
    MONTH=$base_month
  fi
  MM=$(printf '%02d' $MONTH)
  echo "  Seeding $YEAR-$MM..."

  # === NEEDS (recurring monthly) ===
  # Rent
  add_tx $CHEQUE "EFT TO LANDLORD - RENT" 12500 1 "$YEAR-$MM-01" $MACRO_NEEDS $CAT_HOUSING
  # Electricity
  AMT=$((800 + RANDOM % 600))
  add_tx $CHEQUE "ESKOM PREPAID ELECTRICITY" $AMT 1 "$YEAR-$MM-03" $MACRO_NEEDS $CAT_UTILITIES
  # Water
  AMT=$((350 + RANDOM % 200))
  add_tx $CHEQUE "CITY OF CT WATER" $AMT 1 "$YEAR-$MM-05" $MACRO_NEEDS $CAT_UTILITIES
  # Internet
  add_tx $CHEQUE "AFRIHOST FIBRE" 999 1 "$YEAR-$MM-01" $MACRO_NEEDS $CAT_UTILITIES
  # Medical aid
  add_tx $CHEQUE "DISCOVERY HEALTH PREMIUM" 3200 1 "$YEAR-$MM-01" $MACRO_NEEDS $CAT_HEALTHCARE
  # Car insurance
  add_tx $CHEQUE "OUTSURANCE CAR INSURANCE" 1450 1 "$YEAR-$MM-01" $MACRO_NEEDS $CAT_INSURANCE
  # Petrol
  AMT=$((1200 + RANDOM % 800))
  add_tx $CHEQUE "SHELL GARAGE CLAREMONT" $AMT 1 "$YEAR-$MM-08" $MACRO_NEEDS $CAT_TRANSPORT
  AMT=$((900 + RANDOM % 600))
  add_tx $CHEQUE "ENGEN ONE STOP N1" $AMT 1 "$YEAR-$MM-22" $MACRO_NEEDS $CAT_TRANSPORT
  # Groceries (weekly-ish)
  for day in 04 10 17 24; do
    AMT=$((800 + RANDOM % 1200))
    add_tx $CHEQUE "WOOLWORTHS FOOD CAVENDISH" $AMT 1 "$YEAR-$MM-$day" $MACRO_NEEDS $CAT_GROCERIES
  done
  AMT=$((600 + RANDOM % 800))
  add_tx $CHEQUE "CHECKERS CLAREMONT" $AMT 1 "$YEAR-$MM-12" $MACRO_NEEDS $CAT_GROCERIES
  AMT=$((400 + RANDOM % 600))
  add_tx $CHEQUE "PICK N PAY CONSTANTIA" $AMT 1 "$YEAR-$MM-20" $MACRO_NEEDS $CAT_GROCERIES
  # Minimum debt payments
  add_tx $CHEQUE "FNB CREDIT CARD MIN PAYMENT" 750 1 "$YEAR-$MM-25" $MACRO_NEEDS $CAT_DEBT_MIN
  add_tx $CHEQUE "CAPITEC PERSONAL LOAN" 1200 1 "$YEAR-$MM-25" $MACRO_NEEDS $CAT_DEBT_MIN

  # === WANTS ===
  # Subscriptions
  add_tx $CHEQUE "NETFLIX SA" 199 1 "$YEAR-$MM-15" $MACRO_WANTS $CAT_SUBSCRIPTIONS
  add_tx $CHEQUE "SPOTIFY PREMIUM" 79.99 1 "$YEAR-$MM-12" $MACRO_WANTS $CAT_SUBSCRIPTIONS
  add_tx $CHEQUE "SHOWMAX PRO" 349 1 "$YEAR-$MM-01" $MACRO_WANTS $CAT_SUBSCRIPTIONS
  # Dining
  AMT=$((150 + RANDOM % 350))
  add_tx $CHEQUE "UBER EATS *SA" $AMT 1 "$YEAR-$MM-06" $MACRO_WANTS $CAT_DINING
  AMT=$((200 + RANDOM % 400))
  add_tx $CHEQUE "MR D FOOD DELIVERY" $AMT 1 "$YEAR-$MM-14" $MACRO_WANTS $CAT_DINING
  AMT=$((300 + RANDOM % 500))
  add_tx $CHEQUE "CAPE TOWN FISH MARKET V&A" $AMT 1 "$YEAR-$MM-18" $MACRO_WANTS $CAT_DINING
  AMT=$((180 + RANDOM % 300))
  add_tx $CHEQUE "NANDOS CLAREMONT" $AMT 1 "$YEAR-$MM-26" $MACRO_WANTS $CAT_DINING
  # Gym
  add_tx $CHEQUE "VIRGIN ACTIVE GYM" 899 1 "$YEAR-$MM-01" $MACRO_WANTS $CAT_FITNESS
  # Shopping (varies)
  AMT=$((300 + RANDOM % 1500))
  add_tx $CHEQUE "MR PRICE CANAL WALK" $AMT 1 "$YEAR-$MM-09" $MACRO_WANTS $CAT_SHOPPING
  # Entertainment
  AMT=$((100 + RANDOM % 400))
  add_tx $CHEQUE "NU METRO CINEMAS V&A" $AMT 1 "$YEAR-$MM-21" $MACRO_WANTS $CAT_ENTERTAINMENT

  # === GOALS ===
  # Savings transfer
  AMT=$((2000 + RANDOM % 1000))
  add_tx $CHEQUE "TFR TO SAVINGS - EMERGENCY" $AMT 1 "$YEAR-$MM-27" $MACRO_GOALS $CAT_EMERGENCY
  # Extra debt payoff
  AMT=$((500 + RANDOM % 1000))
  add_tx $CHEQUE "EXTRA CC PAYMENT" $AMT 1 "$YEAR-$MM-28" $MACRO_GOALS $CAT_DEBT_PAYOFF
  # Investment
  add_tx $CHEQUE "EASYEQUITIES MONTHLY" 1500 1 "$YEAR-$MM-25" $MACRO_GOALS $CAT_INVEST

  # === INCOME (salary credit) ===
  add_tx $CHEQUE "SALARY - ACME PTY LTD" 45000 2 "$YEAR-$MM-25" $MACRO_NEEDS $CAT_HOUSING

  # A few unclassified (only in current month)
  if [ $month_offset -eq 0 ]; then
    add_tx $CHEQUE "PNA STATIONERS CAPE GATE" 245 1 "$YEAR-$MM-02" "" ""
    add_tx $CHEQUE "TAKEALOT.COM" 1899 1 "$YEAR-$MM-07" "" ""
    add_tx $CHEQUE "CLICKS PHARMACY" 387 1 "$YEAR-$MM-11" "" ""
    add_tx $CHEQUE "BUILDER'S WAREHOUSE" 1250 1 "$YEAR-$MM-13" "" ""
  fi
done

echo "=== Creating goals ==="
# Emergency fund (with some progress)
GOAL1=$(curl -s -X POST $API/goals -H "$AUTH" -H "$CT" \
  -d '{"name":"Emergency Fund","goalType":1,"targetAmount":50000}')
GOAL1_ID=$(echo $GOAL1 | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
# Add progress entries
curl -s -X POST $API/goals/$GOAL1_ID/progress -H "$AUTH" -H "$CT" -d '{"amount":5000,"note":"Oct savings"}' > /dev/null
curl -s -X POST $API/goals/$GOAL1_ID/progress -H "$AUTH" -H "$CT" -d '{"amount":3500,"note":"Nov savings"}' > /dev/null
curl -s -X POST $API/goals/$GOAL1_ID/progress -H "$AUTH" -H "$CT" -d '{"amount":2800,"note":"Dec savings"}' > /dev/null
curl -s -X POST $API/goals/$GOAL1_ID/progress -H "$AUTH" -H "$CT" -d '{"amount":3000,"note":"Jan savings"}' > /dev/null
curl -s -X POST $API/goals/$GOAL1_ID/progress -H "$AUTH" -H "$CT" -d '{"amount":2500,"note":"Feb savings"}' > /dev/null
curl -s -X POST $API/goals/$GOAL1_ID/progress -H "$AUTH" -H "$CT" -d '{"amount":1700,"note":"Mar savings"}' > /dev/null
echo "Emergency Fund: R18,500 of R50,000"

# Set as primary
curl -s -X POST $API/goals/$GOAL1_ID/set-primary -H "$AUTH" > /dev/null

# Debt payoff goal
GOAL2=$(curl -s -X POST $API/goals -H "$AUTH" -H "$CT" \
  -d '{"name":"Pay Off Credit Card","goalType":2,"targetAmount":12500}')
GOAL2_ID=$(echo $GOAL2 | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
curl -s -X POST $API/goals/$GOAL2_ID/progress -H "$AUTH" -H "$CT" -d '{"amount":3200,"note":"Extra payments so far"}' > /dev/null
echo "Credit Card Payoff: R3,200 of R12,500"

# Investment goal
curl -s -X POST $API/goals -H "$AUTH" -H "$CT" \
  -d '{"name":"EasyEquities Portfolio","goalType":4,"targetAmount":100000,"targetDate":"2028-12-31"}' > /dev/null
GOAL3_ID=$(curl -s $API/goals -H "$AUTH" | python3 -c "import sys,json; goals=json.load(sys.stdin); print([g['id'] for g in goals if g['name']=='EasyEquities Portfolio'][0])")
curl -s -X POST $API/goals/$GOAL3_ID/progress -H "$AUTH" -H "$CT" -d '{"amount":9000,"note":"6 months of R1,500"}' > /dev/null
echo "EasyEquities: R9,000 of R100,000"

echo "=== Triggering recurring pattern detection ==="
curl -s -X POST $API/transactions/recurring/detect -H "$AUTH" > /dev/null

echo ""
echo "============================================"
echo "  SEED COMPLETE"
echo "============================================"
echo "  Email:    henrick@cactus.app"
echo "  Password: Cactus2026"
echo "  Income:   R45,000/month"
echo "  Accounts: FNB Cheque + FNB Savings"
echo "  Months:   Oct 2025 - Mar 2026 (6 months)"
echo "  Transactions: ~180 classified + 4 unclassified"
echo "  Goals:    Emergency Fund (37%), CC Payoff (26%), Investments (9%)"
echo "  Debts:    Credit Card R12,500 + Personal Loan R28,000"
echo "============================================"
