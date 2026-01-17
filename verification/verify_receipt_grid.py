
from playwright.sync_api import sync_playwright, expect

def verify_receipt_grid():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        print("Navigating to home page...")
        page.goto("http://localhost:5173")

        # Wait for the app to load
        page.wait_for_timeout(2000)

        # 1. Trigger Modal Opening
        print("Opening upload modal...")
        page.get_by_text("Click to upload", exact=True).click()

        # 2. Setup network interception
        print("Setting up network interception...")
        def handle_route(route):
            print(f"Intercepted request to: {route.request.url}")
            response_body = {
                "items": [
                    { "name": "Coffee", "price": 5.00, "quantity": 1 },
                    { "name": "Discount", "price": -2.00, "quantity": 1 },
                    { "name": "Tax", "price": 0.50, "quantity": 1 }
                ],
                "other_charges": [],
                "total": 3.50,
                "currency": "USD"
            }
            route.fulfill(
                status=200,
                content_type="application/json",
                body=str(response_body).replace("'", '"'),
                headers={"Access-Control-Allow-Origin": "*"}
            )

        # Match exactly the OCR endpoint. Since it's localhost:3000/api/ocr, we can use a glob or regex.
        # It's a POST to /api/ocr
        page.route("**/api/ocr", handle_route)

        # 3. Upload File in Modal
        print("Uploading file...")
        with page.expect_file_chooser() as fc_info:
            page.locator("label[for='dropzone-file']").click()

        file_chooser = fc_info.value
        file_chooser.set_files("verification/dummy_receipt.png")

        # 4. Process the file
        print("Processing file...")
        process_btn = page.get_by_role("button", name="Process 1 File")
        expect(process_btn).to_be_visible()
        process_btn.click()

        # 5. Review Step (Save All)
        print("Saving receipt...")
        # This might take a moment as the "mock" fetch happens
        save_btn = page.get_by_role("button", name="Save All")
        expect(save_btn).to_be_visible(timeout=10000)
        save_btn.click()

        # 6. Verify Grid
        print("Waiting for grid...")
        expect(page.get_by_text("Coffee")).to_be_visible(timeout=10000)

        # Check negative value styling
        print("Verifying UI elements...")
        discount_price = page.get_by_text("-2.00")
        expect(discount_price).to_be_visible()

        class_attr = discount_price.get_attribute("class")
        print(f"Discount classes: {class_attr}")
        assert "text-green-600" in class_attr or "text-green-400" in class_attr
        assert "text-right" in class_attr

        # Screenshot
        print("Taking screenshot...")
        page.screenshot(path="verification/verification.png", full_page=True)

        print("Verification successful!")
        browser.close()

if __name__ == "__main__":
    verify_receipt_grid()
