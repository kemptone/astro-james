import '../../components/wc-texarea-sizer'

function AzureTalker() {
  const html = /*html*/ `
    <fieldset class="talker-wrap">
        <div class="grid">
            <div class="face">
               <img src="/talkers2_faces/Sonia.webp">
            </div>
            <div>
              <wc-textarea-sizer data-min="20" data-max="500">
                <textarea name="text" rows="1"></textarea>
              </wc-textarea-sizer>
            </div>
        </div>
    </fieldset>
    `
}
