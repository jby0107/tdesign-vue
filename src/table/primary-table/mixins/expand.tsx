import Vue, { CreateElement, VNode } from 'vue';
import { TdPrimaryTableProps } from '../../../../types/primary-table/TdPrimaryTableProps';
import baseTableProps from '../../../../types/base-table/props';
import ExpandBox from '../expand-box';
import TableRow from '../../base-table/table-row';
import { ExpandProps, RenderExpandRow } from '../../util/interface';
import { filterDataByIds, getRecord } from '../../util/common';
import { prefix } from '../../../config';
import get from 'lodash/get';
import { emitEvent } from '../../../utils/event';

type Columns = TdPrimaryTableProps['columns'];

const expandedColKey = 'expanded-icon-cell';
export default Vue.extend({
  name: `${prefix}-primary-table-expand`,
  props: {
    data: baseTableProps.data,
    rowKey: baseTableProps.rowKey,
    ...ExpandProps,
  },
  computed: {
    reRowKey(): string {
      return this.rowKey || 'id';
    },
  },
  methods: {
    // get
    getExpandColumns(columns: Columns): Columns {
      return this.expandedRow
        ? [
          {
            colKey: expandedColKey,
            width: 25,
            attrs: { class: [`${prefix}-table-expandable-icon-cell`] },
            cell: (h, { row }) => this.renderExpandIconCell({ row }),
          },
          ...columns,
        ]
        : columns;
    },

    // render
    // 渲染展开单元格内容
    renderExpandIconCell({ row = {} }: Record<string, any>): VNode {
      const { expandedRowKeys = [] } = this;
      const id = get(row, this.reRowKey);
      const expanded = expandedRowKeys.indexOf(id) !== -1;
      return <ExpandBox expanded={expanded} onClick={(): void => this.handleExpandChange(row)} />;
    },
    // 渲染被展开的TableRow内容
    renderExpandedRow({ rows, row, columns: defaultColumns, rowIndex }: RenderExpandRow): VNode {
      const columnCounts = defaultColumns.length;
      if (!this.expandedRow) return; // 若无展开渲染函数，则无需处理行数据

      const { expandedRowKeys, expandedRow } = this;
      const id = get(row, this.reRowKey);
      const isShowExpanded = expandedRowKeys.includes(id);
      const params = {
        record: getRecord(row),
        row,
        index: rowIndex,
      };
      const columns = [
        {
          colKey: 'expanded-row',
          attrs: {
            colspan: columnCounts,
            class: [`${prefix}-table-expanded-cell`],
          },
          render: (h: CreateElement): VNode => expandedRow(h, params) as VNode,
        },
      ];

      rows.push(<TableRow
          rowKey={this.rowKey}
          style={{ ...(!isShowExpanded ? { display: 'none' } : {}) }}
          columns={columns}
        />);
    },

    // handle
    handleExpandChange(record: Record<string, any> = {}): void {
      const expandedRowKeys = [...this.expandedRowKeys] as Array<string | number>;
      const id = get(record, this.reRowKey);
      const expandedRowIndex = expandedRowKeys.indexOf(id);
      const isExpanded = expandedRowIndex !== -1;
      isExpanded
        ? expandedRowKeys.splice(expandedRowIndex, 1) // 删除
        : expandedRowKeys.push(id); // 增加
      emitEvent(this, 'expand-change', expandedRowKeys, {
        expandedRowData: filterDataByIds(this.data, expandedRowKeys),
      });
    },
  },
});