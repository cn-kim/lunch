import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://ecfxzhvcqcztamqyqela.supabase.co',
  'sb_publishable_cPh6SmkwfVKY8KQHdC2Tow__NOKAx92'
)

window.storage = {
  async get(key) {
    const { data } = await supabase
      .from('store')
      .select('value')
      .eq('key', key)
      .single()
    return data ? { value: data.value } : null
  },
  async set(key, value) {
    await supabase
      .from('store')
      .upsert({ key, value, shared: true }, { onConflict: 'key' })
    return { value }
  },
  async delete(key) {
    await supabase
      .from('store')
      .delete()
      .eq('key', key)
    return { deleted: true }
  }
}
