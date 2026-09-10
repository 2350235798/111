import type {
  BaseEntitySelectProps,
  ItemValue,
} from '@client/src/components/business-ui/entity-combobox/shared-types';
import type { DepartmentInfo } from '@client/src/components/business-ui/types/services';

export type { DepartmentInfo };

export type Department = ItemValue<DepartmentInfo>;

export type DepartmentSelectProps = BaseEntitySelectProps<Department>;
