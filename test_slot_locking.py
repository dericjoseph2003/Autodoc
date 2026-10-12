import urllib.request
import json
import sys

# Ensure UTF-8 output on Windows console
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = 'http://localhost:5000/api'

def make_request(url, method='GET', data=None, token=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    encoded_data = json.dumps(data).encode('utf-8') if data else None
    req = urllib.request.Request(url, data=encoded_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, {'message': body}

def main():
    print("=== Testing Slot Locking, Atomic Safeguards & Availability Endpoint ===")

    # 1. Login as Owner
    status, login_res = make_request(
        f'{BASE_URL}/users/login',
        method='POST',
        data={'email': 'alex.owner@autodoc.com', 'password': 'autodocowner2026'}
    )
    if status != 200 or not login_res.get('token'):
        print(f"[FAIL] Login failed ({status}): {login_res}")
        sys.exit(1)
    
    token = login_res['token']
    print("[OK] Owner logged in successfully.")

    # 2. Get Service Centers list to pick a center
    status, sc_res = make_request(f'{BASE_URL}/service-centers', token=token)
    centers = sc_res.get('serviceCenters') or sc_res.get('data') or []
    if not centers:
        print("[FAIL] No service centers found")
        sys.exit(1)

    test_center = centers[0]
    center_id = test_center['_id']
    center_name = test_center.get('name') or test_center.get('service_center_name') or 'Test Center'
    print(f"[OK] Selected Service Center: {center_name} ({center_id})")

    import time
    test_date = f"2026-11-{(int(time.time()) % 25) + 1:02d}"
    test_slot = '10:30 AM - 11:30 AM'

    # 3. Check initial available slots
    status, slots_res = make_request(f'{BASE_URL}/service-centers/{center_id}/available-slots?date={test_date}', token=token)
    print(f"[OK] Available slots query status {status}: booked={slots_res.get('bookedSlots')}")
    assert status == 200, "Expected status 200 for available-slots"

    # 4. Book appointment #1
    booking_data = {
        'serviceCenter': center_id,
        'date': test_date,
        'timeSlot': test_slot,
        'serviceType': 'General Maintenance'
    }
    status1, book1_res = make_request(f'{BASE_URL}/appointments', method='POST', data=booking_data, token=token)
    print(f"-> First Booking Response ({status1}): success={book1_res.get('success')}")
    if status1 != 201:
        print(f"[FAIL] First booking failed: {book1_res}")
        sys.exit(1)
    
    appt1_id = book1_res['appointment']['_id']
    print(f"[OK] Appointment #1 created: ID={appt1_id}")

    # 5. Check available slots endpoint - slot should now be in bookedSlots
    status, slots_res2 = make_request(f'{BASE_URL}/service-centers/{center_id}/available-slots?date={test_date}', token=token)
    booked_now = slots_res2.get('bookedSlots', [])
    print(f"[OK] Booked slots after booking #1: {booked_now}")
    assert test_slot in booked_now, "Expected test_slot to be locked in bookedSlots"

    # 6. Attempt Duplicate Booking #2 (Should fail with 400 & clear message)
    status2, book2_res = make_request(f'{BASE_URL}/appointments', method='POST', data=booking_data, token=token)
    print(f"-> Duplicate Booking Response ({status2}): {book2_res}")
    assert status2 == 400, f"Expected 400 Bad Request, got {status2}"
    assert "already booked" in book2_res.get('message', '').lower(), "Expected 'already booked' error message"
    print("[OK] Duplicate booking correctly REJECTED with slot lock error!")

    # 7. Cancel Appointment #1
    status, cancel_res = make_request(
        f'{BASE_URL}/appointments/{appt1_id}/status',
        method='PATCH',
        data={'status': 'cancelled'},
        token=token
    )
    print(f"-> Cancellation status: {status}")
    assert status == 200, "Expected 200 OK on cancellation"
    print("[OK] Appointment cancelled successfully.")

    # 8. Check available slots endpoint after cancellation - slot should be UNLOCKED!
    status, slots_res3 = make_request(f'{BASE_URL}/service-centers/{center_id}/available-slots?date={test_date}', token=token)
    booked_after_cancel = slots_res3.get('bookedSlots', [])
    print(f"[OK] Booked slots after cancellation: {booked_after_cancel}")
    assert test_slot not in booked_after_cancel, "Expected test_slot to be released/unlocked after cancellation"
    print("[OK] Slot released and unlocked automatically!")

    # 9. Re-book the same slot after cancellation - should succeed!
    status3, book3_res = make_request(f'{BASE_URL}/appointments', method='POST', data=booking_data, token=token)
    print(f"-> Re-booking response ({status3}): success={book3_res.get('success')}")
    assert status3 == 201, "Expected 201 Created on re-booking unlocked slot"
    print("[OK] Slot re-booked successfully after cancellation!")

    print("\nALL 5 SLOT LOCKING & AVAILABILITY TESTS PASSED PERFECTLY!\n")

if __name__ == '__main__':
    main()
