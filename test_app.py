from playwright.sync_api import sync_playwright
import time

BASE = 'http://localhost:4173'

def run():
    errors = []
    console_errors = []

    def log(msg):
        print(f'  [TEST] {msg}')

    def check(label, cond):
        if cond:
            log(f'✓ {label}')
        else:
            errors.append(label)
            log(f'✗ FAIL: {label}')

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 390, 'height': 844})

        page.on('console', lambda m: console_errors.append(m.text) if m.type == 'error' else None)

        # ===== TEST 1: Home Page =====
        log('=== TEST 1: Home Page ===')
        page.goto(BASE)
        page.wait_for_load_state('networkidle')
        time.sleep(1)

        title = page.title()
        check('Page title is 艺术探索星图', '艺术探索星图' in title)

        h1 = page.locator('h1').first.text_content()
        check('H1 contains 艺术探索星图', '艺术探索星图' in h1)

        count_text = page.locator('text=共').text_content()
        check('Shows item count', '共' in count_text)

        btns = page.locator('.home-btn').all()
        check('Has 2 home buttons (藏品入库, 藏宝阁)', len(btns) == 2)

        footer = page.locator('.home-footer').text_content()
        check('Footer has 一键导出 link', '一键导出' in footer)

        # ===== TEST 2: Navigate to Collection =====
        log('=== TEST 2: Navigate to Collection ===')
        page.locator('text=藏宝阁').click()
        page.wait_for_timeout(500)

        h2 = page.locator('#collection-view h2').text_content()
        check('Collection page has 藏宝阁 title', '藏宝阁' in h2)

        item_cards = page.locator('.item-card').all()
        check(f'Has item cards (sample data loaded), found {len(item_cards)}', len(item_cards) > 0)

        # ===== TEST 3: Filter Bar =====
        log('=== TEST 3: Filter Bar ===')
        chips = page.locator('.filter-chip').all()
        check(f'Has filter chips, found {len(chips)}', len(chips) > 0)

        # Click a status filter
        status_chip = page.locator('.filter-chip', has_text='已探索').first
        if status_chip.count() > 0:
            status_chip.click()
            page.wait_for_timeout(300)
            filtered_count = page.locator('.item-card').count()
            log(f'After filtering by 已探索: {filtered_count} cards')
            # Click again to deselect
            status_chip.click()
            page.wait_for_timeout(300)

        # ===== TEST 4: Item Card Expand =====
        log('=== TEST 4: Item Card Expand ===')
        first_card = page.locator('.item-card').first
        first_card.click()
        page.wait_for_timeout(500)

        expanded = page.locator('.item-card.expanded').count()
        check('Card expands on click', expanded > 0)

        sensory = page.locator('.sensory-section').count()
        check('Expanded card shows sensory fingerprint', sensory > 0)

        # ===== TEST 5: Wish Panel (感受不可能) =====
        log('=== TEST 5: Wish Panel ===')
        wish_btn = page.locator('.wish-toggle-btn')
        if wish_btn.count() > 0:
            wish_btn.click()
            page.wait_for_timeout(300)
            panel = page.locator('.wish-panel')
            check('Wish panel opens', panel.count() > 0)

            sliders = page.locator('.wish-sense-slider-row').all()
            check(f'Wish panel has 7 sense sliders, found {len(sliders)}', len(sliders) == 7)

            close_btn = page.locator('.wish-close-btn')
            if close_btn.count() > 0:
                close_btn.click()
                page.wait_for_timeout(300)
        else:
            errors.append('Wish toggle button not found')
            log('✗ FAIL: Wish toggle button not found')

        # ===== TEST 6: Add Item Flow =====
        log('=== TEST 6: Add Item Flow ===')
        page.locator('text=藏品入库').first.click()
        page.wait_for_timeout(500)

        add_title = page.locator('#add-view h2').text_content()
        check('Add view has 藏品入库 title', '藏品入库' in add_title)

        title_input = page.locator('.add-input')
        title_input.fill('测试艺术体验')
        page.wait_for_timeout(100)

        desc = page.locator('.add-textarea')
        desc.fill('这是一段测试描述')
        page.wait_for_timeout(100)

        submit = page.locator('.add-submit-btn')
        submit.click()
        page.wait_for_timeout(2000)

        coll = page.locator('#collection-view')
        check('Navigates back to collection after add', coll.count() > 0)

        # ===== TEST 7: Edit Item =====
        log('=== TEST 7: Edit Item ===')
        card = page.locator('.item-card').first
        card.click()
        page.wait_for_timeout(500)

        edit_btn = page.locator('.action-btn.edit')
        if edit_btn.count() > 0:
            edit_btn.click()
            page.wait_for_timeout(300)

            edit_input = page.locator('.edit-input')
            check('Edit mode shows input field', edit_input.count() > 0)

            edit_input.fill('修改后的标题')
            page.wait_for_timeout(100)

            save_btn = page.locator('.edit-btn.save')
            save_btn.click()
            page.wait_for_timeout(500)
        else:
            errors.append('Edit button not found')
            log('✗ FAIL: Edit button not found on card')

        # ===== TEST 8: Delete Confirmation =====
        log('=== TEST 8: Delete Confirmation ===')
        card2 = page.locator('.item-card').first
        card2.click()
        page.wait_for_timeout(500)

        del_btn = page.locator('.action-btn.delete')
        if del_btn.count() > 0:
            del_btn.click()
            page.wait_for_timeout(300)

            confirm_del = page.locator('.delete-confirm-btn.confirm')
            check('Delete confirmation dialog shows', confirm_del.count() > 0)

            cancel_btn = page.locator('.delete-confirm-btn.cancel')
            if cancel_btn.count() > 0:
                cancel_btn.click()
                page.wait_for_timeout(300)
        else:
            errors.append('Delete button not found')
            log('✗ FAIL: Delete button not found')

        # ===== TEST 9: Import Modal =====
        log('=== TEST 9: Import Modal ===')
        import_btn = page.locator('.header-btn.import')
        if import_btn.count() > 0:
            import_btn.click()
            page.wait_for_timeout(500)

            modal = page.locator('.import-modal')
            check('Import modal opens', modal.count() > 0)

            close_import = page.locator('.import-modal-close')
            if close_import.count() > 0:
                close_import.click()
                page.wait_for_timeout(300)
        else:
            errors.append('Import button not found')
            log('✗ FAIL: Import button not found')

        # ===== TEST 10: History Navigation =====
        log('=== TEST 10: History Navigation ===')
        page.go_back()
        page.wait_for_timeout(500)
        home = page.locator('#home-view')
        check('Browser back navigates to home', home.count() > 0)

        page.go_forward()
        page.wait_for_timeout(500)
        coll2 = page.locator('#collection-view')
        check('Browser forward navigates to collection', coll2.count() > 0)

        # ===== TEST 11: Console Errors =====
        log('=== TEST 11: Console Errors ===')
        critical_errors = [e for e in console_errors if 'Error' in e]
        if critical_errors:
            log(f'Console errors: {critical_errors[:5]}')
        check('No console errors', len(critical_errors) == 0)

        # ===== TEST 12: Mobile Responsive =====
        log('=== TEST 12: Mobile Responsive ===')
        page.set_viewport_size({'width': 390, 'height': 844})
        page.reload()
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(500)

        grid = page.locator('.items-grid')
        grid_box = grid.bounding_box()
        if grid_box:
            check(f'Grid fits mobile width ({grid_box["width"]:.0f}px)', grid_box['width'] <= 390)

        # ===== TEST 13: Back Button on Collection =====
        log('=== TEST 13: Back to Home ===')
        back_btn = page.locator('.back-btn')
        if back_btn.count() > 0:
            back_btn.first.click()
            page.wait_for_timeout(500)
            check('Back button returns to home', page.locator('#home-view').count() > 0)
        else:
            errors.append('Back button not found')
            log('✗ FAIL: Back button not found')

        # ===== RESULTS =====
        log('')
        log('=== RESULTS ===')
        if errors:
            log(f'FAILED: {len(errors)} test(s)')
            for e in errors:
                log(f'  - {e}')
        else:
            log('ALL TESTS PASSED')

        browser.close()
        return len(errors) == 0

if __name__ == '__main__':
    success = run()
    exit(0 if success else 1)
